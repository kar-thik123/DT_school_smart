"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const crypto_1 = __importDefault(require("crypto"));
const xlsx = __importStar(require("xlsx"));
const csv_parse_1 = require("csv-parse");
const bulk_import_registry_1 = require("../services/bulk-import/bulk-import.registry");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const audit_service_1 = require("../services/audit.service");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const error_parser_1 = require("../services/bulk-import/error-parser");
const utils_1 = require("../services/bulk-import/utils");
const router = (0, express_1.Router)();
const IMPORTS_DIR = path_1.default.join(__dirname, '../../uploads/imports');
if (!fs_1.default.existsSync(IMPORTS_DIR)) {
    fs_1.default.mkdirSync(IMPORTS_DIR, { recursive: true });
}
const ENTITY_PERMISSION_MAP = {
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
const verifyBulkImportPermission = (entityType, req) => {
    // SYSTEM_ADMIN no longer bypasses. Rely on database permissions.
    const perm = ENTITY_PERMISSION_MAP[entityType.toUpperCase()];
    if (!perm)
        return false;
    const userPermissions = req.user?.permissions || [];
    const required = `${perm.module}:${perm.action}`;
    if (userPermissions.includes(required))
        return true;
    // Fallback mappings (same as requirePermission)
    if (perm.module === 'ACADEMIC_STRUCTURE' && (perm.action === 'CREATE' || perm.action === 'EDIT' || perm.action === 'DELETE')) {
        if (userPermissions.includes('UNITS_LIST:MANAGE_SYLLABUS') ||
            userPermissions.includes('ACADEMIC:MANAGE_SYLLABUS')) {
            return true;
        }
    }
    return false;
};
router.use(auth_middleware_1.authMiddleware);
// Setup multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
// ==========================================
// 1. ANALYZE ROUTE
// ==========================================
// Receives a CSV file, passes its contents to the bound processor for Resolution and Validation,
// and returns the preview table structure back to the frontend.
router.post('/:entityType/analyze', upload.single('file'), async (req, res) => {
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
        const processor = (0, bulk_import_registry_1.getBulkProcessor)(entityType, orgId, userId, req.academic_year_id);
        if (!processor) {
            return res.status(400).json({ message: `Bulk import for entity type '${entityType}' is not supported.` });
        }
        let rawRows = [];
        try {
            if (file.originalname.toLowerCase().endsWith('.csv')) {
                rawRows = await new Promise((resolve, reject) => {
                    (0, csv_parse_1.parse)(file.buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true }, (err, records) => {
                        if (err)
                            reject(err);
                        else
                            resolve(records);
                    });
                });
            }
            else {
                const workbook = xlsx.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
                rawRows = rawRows.map(row => {
                    const trimmedRow = {};
                    for (const [key, value] of Object.entries(row)) {
                        trimmedRow[(0, utils_1.safeNormalize)(key)] = value;
                    }
                    return trimmedRow;
                });
            }
        }
        catch (err) {
            return res.status(400).json({ message: 'Failed to parse file. Ensure it is a valid CSV or Excel file.' });
        }
        // Filter out completely empty rows
        rawRows = rawRows.filter(row => {
            return Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '');
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
            const jobId = crypto_1.default.randomUUID();
            fs_1.default.writeFileSync(path_1.default.join(IMPORTS_DIR, `${jobId}.json`), JSON.stringify(processedRows));
            // Clean up old jobs after 1 hour
            setTimeout(() => {
                const filePath = path_1.default.join(IMPORTS_DIR, `${jobId}.json`);
                if (fs_1.default.existsSync(filePath))
                    fs_1.default.unlinkSync(filePath);
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
    }
    catch (error) {
        const parsed = (0, error_parser_1.parseError)(error, {
            failedOrganization: req.user?.organization_id,
            httpStatus: 500,
        });
        console.error(`[Bulk-Import-Analyze] Error:`, parsed);
        return res.status(parsed.httpStatus).json(parsed);
    }
});
// ==========================================
// 2. COMMIT ROUTE
// ==========================================
// Receives an array of pre-validated JSON objects from the UI (which extracted only the green rows)
// and passes them to the database commit strategy.
router.post('/:entityType/commit', async (req, res) => {
    const startTime = Date.now();
    let orgId = '';
    let userId = '';
    let jobId = '';
    const { entityType } = req.params;
    try {
        if (!verifyBulkImportPermission(entityType, req)) {
            return res.status(403).json({ message: `Forbidden: You do not have permission to import ${entityType}.` });
        }
        orgId = req.user.organization_id;
        userId = req.user.user_id;
        let { validRows, conflictResolutions } = req.body;
        jobId = req.body.jobId;
        if (entityType.toUpperCase() === 'USERS' && jobId) {
            const filePath = path_1.default.join(IMPORTS_DIR, `${jobId}.json`);
            if (!fs_1.default.existsSync(filePath)) {
                return res.status(400).json({ message: 'Import session expired or invalid. Please analyze the file again.' });
            }
            const cachedRows = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
            validRows = cachedRows.filter((r) => r.status === 'VALID').map((r) => r.data);
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (e) {
                console.warn('Could not delete session file', e);
            }
        }
        if (!Array.isArray(validRows) || validRows.length === 0) {
            return res.status(400).json({ message: 'No valid rows provided for commit.' });
        }
        const processor = (0, bulk_import_registry_1.getBulkProcessor)(entityType, orgId, userId, req.academic_year_id);
        if (!processor) {
            return res.status(400).json({ message: `Bulk import for entity type '${entityType}' is not supported.` });
        }
        const result = await processor.commit(validRows, conflictResolutions, jobId);
        await (0, audit_service_1.logAuditEvent)({
            organization_id: orgId,
            user_id: userId,
            user_name: req.user.name,
            action_type: 'IMPORT',
            entity_type: entityType.toUpperCase(),
            entity_id: 'BULK_IMPORT',
            metadata: { entity_type: entityType, success_count: result.success_count, failure_count: result.failure_count }
        });
        console.log(`[BULK IMPORT SUCCESS]`, JSON.stringify({
            jobId: jobId || 'N/A',
            organizationId: orgId,
            academicYear: req.academic_year_id || 'N/A',
            rowsImported: result.success_count,
            rowsSkipped: result.failure_count,
            executionTimeMs: Date.now() - startTime
        }));
        return res.status(200).json({
            message: `Bulk import completed successfully for ${result.success_count} rows.`,
            result
        });
    }
    catch (error) {
        const parsed = (0, error_parser_1.parseError)(error, {
            failedOrganization: req.user?.organization_id,
            httpStatus: error.statusCode ? Number(error.statusCode) : 500,
        });
        console.error(`[Bulk-Import-Commit] Error:`, parsed);
        return res.status(parsed.httpStatus).json(parsed);
    }
});
exports.default = router;
