import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { getBulkProcessor } from '../services/bulk-import/bulk-import.registry';
import { authMiddleware } from '../middlewares/auth.middleware';
import { logAuditEvent } from '../services/audit.service';

const router = Router();

const ENTITY_PERMISSION_MAP: Record<string, { module: string, action: string }> = {
  'STUDENT_ENROLLMENT': { module: 'USERS', action: 'BULK_IMPORT' },
  'STUDENT_MAPPING': { module: 'USERS', action: 'BULK_IMPORT' },
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
      return res.status(400).json({ message: 'No CSV file provided.' });
    }

    const processor = getBulkProcessor(entityType, orgId, userId);
    if (!processor) {
      return res.status(400).json({ message: `Bulk import for entity type '${entityType}' is not supported.` });
    }

    // Parse CSV into array of raw objects
    const rawRows = await new Promise<any[]>((resolve, reject) => {
      parse(file.buffer, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    if (rawRows.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or formatted incorrectly.' });
    }

    // Step 1: Pre-resolve relations (e.g. bulk fetch emails, IDs instead of inside loop)
    await processor.resolveRelations(rawRows);

    // Step 2: Validate each row using the pre-resolved context
    const validationPromises = rawRows.map(row => processor.validateRow(row));
    const processedRows = await Promise.all(validationPromises);

    // Return the required standard format
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
    const { validRows, conflictResolutions } = req.body;

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ message: 'No valid rows provided for commit.' });
    }

    const processor = getBulkProcessor(entityType, orgId, userId);
    if (!processor) {
      return res.status(400).json({ message: `Bulk import for entity type '${entityType}' is not supported.` });
    }

    const result = await processor.commit(validRows, conflictResolutions);

    await logAuditEvent({
      organization_id: orgId,
      user_id: userId,
      user_name: req.user.name,
      action_type: 'IMPORT',
      entity_type: entityType.toUpperCase() === 'QUESTION_BANK' ? 'QUESTION' :
                   entityType.toUpperCase() === 'TEACHER_ASSIGNMENT' ? 'TEACHER_ASSIGNMENT' : 'SYLLABUS',
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
