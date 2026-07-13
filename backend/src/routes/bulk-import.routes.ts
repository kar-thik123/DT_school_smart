import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import * as xlsx from 'xlsx';
import { parse } from 'csv-parse';
import { getBulkProcessor } from '../services/bulk-import/bulk-import.registry';
import { authMiddleware } from '../middlewares/auth.middleware';
import { logAuditEvent } from '../services/audit.service';
import fs from 'fs';
import path from 'path';

const router = Router();
const IMPORTS_DIR = path.join(__dirname, '../../uploads/imports');
if (!fs.existsSync(IMPORTS_DIR)) {
  fs.mkdirSync(IMPORTS_DIR, { recursive: true });
}

const ENTITY_PERMISSION_MAP: Record<string, { module: string, action: string }> = {
  'STUDENT_ENROLLMENT': { module: 'STUDENT_ENROLLMENT', action: 'IMPORT' },
  'STUDENT_MAPPING': { module: 'USERS', action: 'IMPORT' },
  'USERS': { module: 'USERS', action: 'IMPORT' },
  'TEACHER_ASSIGNMENT': { module: 'TEACHER_ASSIGNMENT', action: 'CREATE' },
  'SUBJECT_GROUPS': { module: 'ACADEMIC_STRUCTURE', action: 'CREATE' },
  'QUESTION_BANK': { module: 'QUESTION_BANK', action: 'IMPORT' },
  'GRADES': { module: 'ACADEMIC_STRUCTURE', action: 'CREATE' },
  'SECTIONS': { module: 'ACADEMIC_STRUCTURE', action: 'CREATE' },
  'SUBJECTS': { module: 'ACADEMIC_STRUCTURE', action: 'CREATE' },
  'UNITS': { module: 'ACADEMIC_STRUCTURE', action: 'CREATE' },
  'TOPICS': { module: 'ACADEMIC_STRUCTURE', action: 'CREATE' },
  'ACADEMIC_STRUCTURE_FULL': { module: 'ACADEMIC_STRUCTURE', action: 'CREATE' }
};

const verifyBulkImportPermission = (entityType: string, req: any): boolean => {
  // SYSTEM_ADMIN no longer bypasses. Rely on database permissions.

  const perm = ENTITY_PERMISSION_MAP[entityType.toUpperCase()];
  if (!perm) return false;

  const userPermissions = req.user?.permissions || [];
  const required = `${perm.module}:${perm.action}`;

  if (userPermissions.includes(required)) return true;

  // Fallback mappings (same as requirePermission)
  if (perm.module === 'ACADEMIC_STRUCTURE' && (perm.action === 'CREATE' || perm.action === 'EDIT' || perm.action === 'DELETE')) {
    if (
      userPermissions.includes('UNITS_LIST:MANAGE_SYLLABUS') ||
      userPermissions.includes('ACADEMIC:MANAGE_SYLLABUS')
    ) {
      return true;
    }
  }

  return false;
};
router.use(authMiddleware);

// Setup multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export interface AuthenticatedRequest extends Request {
  user: {
    user_id: string;
    organization_id: string;
    role: string;
  };
}

// ==========================================
// 1. ANALYZE ROUTE
// ==========================================
// Receives a CSV file, passes its contents to the bound processor for Resolution and Validation,
// and returns the preview table structure back to the frontend.
router.post('/:entityType/analyze', upload.single('file'), async (req: any, res: Response) => {
  try {
    const { entityType } = req.params;
    if (!verifyBulkImportPermission(entityType, req)) {
      return res.status(403).json({ message: `Forbidden: You do not have permission to import ${entityType}.` });
    }
    const orgId = req.user.organization_id;
    const userId = req.user.user_id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded. Please provide a valid CSV or Excel file.' });
    }

    const processor = getBulkProcessor(entityType, orgId, userId, req.academic_year_id);
    if (!processor) {
      return res.status(400).json({ message: `Bulk import for entity type '${entityType}' is not supported.` });
    }

    let rawRows: any[] = [];
    try {
      if (file.originalname.toLowerCase().endsWith('.csv')) {
        rawRows = await new Promise<any[]>((resolve, reject) => {
          parse(file.buffer, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
            if (err) reject(err);
            else resolve(records);
          });
        });
      } else {
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
        
        rawRows = rawRows.map(row => {
          const trimmedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            trimmedRow[key.trim()] = typeof value === 'string' ? value.trim() : value;
          }
          return trimmedRow;
        });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Failed to parse file. Ensure it is a valid CSV or Excel file.' });
    }

    // Filter out completely empty rows
    rawRows = rawRows.filter(row => {
      return Object.values(row).some(
        value => value !== null && value !== undefined && String(value).trim() !== ''
      );
    });

    if (rawRows.length === 0) {
      return res.status(400).json({ message: 'File is empty or formatted incorrectly.' });
    }

    // Attach any extra body params to each row (e.g., default_password)
    const extraParams = { ...req.body };
    if (Object.keys(extraParams).length > 0) {
      rawRows.forEach(row => {
        Object.assign(row, extraParams);
      });
    }

    // Step 1: Pre-resolve relations (e.g. bulk fetch emails, IDs instead of inside loop)
    await processor.resolveRelations(rawRows);

    // Step 2: Validate each row using the pre-resolved context
    const validationPromises = rawRows.map(row => processor.validateRow(row));
    const processedRows = await Promise.all(validationPromises);

    if (entityType.toUpperCase() === 'USERS') {
      const jobId = crypto.randomUUID();
      fs.writeFileSync(path.join(IMPORTS_DIR, `${jobId}.json`), JSON.stringify(processedRows));
      
      // Clean up old jobs after 1 hour
      setTimeout(() => {
        const filePath = path.join(IMPORTS_DIR, `${jobId}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 60 * 60 * 1000);

      const validRowsCount = processedRows.filter(r => r.status === 'VALID').length;
      const invalidRowsCount = processedRows.length - validRowsCount;

      return res.json({
        jobId,
        totalRows: processedRows.length,
        validRowsCount,
        invalidRowsCount,
        preview: processedRows.slice(0, 100),
        invalidPreview: processedRows.filter(r => r.status !== 'VALID') // Frontend needs this for error report
      });
    }

    // Return the required standard format for other modules
    return res.json({
      rows: processedRows
    });

  } catch (error: any) {
    console.error(`[Bulk-Import-Analyze] Error:`, error);
    return res.status(500).json({ message: 'Analyzing CSV failed.', error: error.message });
  }
});

// ==========================================
// 2. COMMIT ROUTE
// ==========================================
// Receives an array of pre-validated JSON objects from the UI (which extracted only the green rows)
// and passes them to the database commit strategy.
router.post('/:entityType/commit', async (req: any, res: Response) => {
  try {
    const { entityType } = req.params;
    if (!verifyBulkImportPermission(entityType, req)) {
      return res.status(403).json({ message: `Forbidden: You do not have permission to import ${entityType}.` });
    }
    const orgId = req.user.organization_id;
    const userId = req.user.user_id;
    let { validRows, conflictResolutions, jobId } = req.body;

    if (entityType.toUpperCase() === 'USERS' && jobId) {
      const filePath = path.join(IMPORTS_DIR, `${jobId}.json`);
      if (!fs.existsSync(filePath)) {
        return res.status(400).json({ message: 'Import session expired or invalid. Please analyze the file again.' });
      }
      const cachedRows = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      validRows = cachedRows.filter((r: any) => r.status === 'VALID').map((r: any) => r.data);
      try { fs.unlinkSync(filePath); } catch(e) { console.warn('Could not delete session file', e); }
    }

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ message: 'No valid rows provided for commit.' });
    }

    const processor = getBulkProcessor(entityType, orgId, userId, req.academic_year_id);
    if (!processor) {
      return res.status(400).json({ message: `Bulk import for entity type '${entityType}' is not supported.` });
    }

    const result = await processor.commit(validRows, conflictResolutions);

    await logAuditEvent({
      organization_id: orgId,
      user_id: userId,
      user_name: req.user.name,
      action_type: 'IMPORT',
      entity_type: entityType.toUpperCase(),
      entity_id: 'BULK_IMPORT',
      metadata: { entity_type: entityType, success_count: result.success_count, failure_count: result.failure_count }
    });

    return res.status(200).json({
      message: `Bulk import completed successfully for ${result.success_count} rows.`,
      result
    });

  } catch (error: any) {
    console.error(`[Bulk-Import-Commit] Error:`, error);
    return res.status(500).json({ message: 'Committing valid rows failed.', error: error.message });
  }
});

export default router;
