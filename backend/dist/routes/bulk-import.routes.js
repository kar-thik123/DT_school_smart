"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const csv_parse_1 = require("csv-parse");
const bulk_import_registry_1 = require("../services/bulk-import/bulk-import.registry");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
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
        const orgId = req.user.organization_id;
        const userId = req.user.user_id;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No CSV file provided.' });
        }
        const processor = (0, bulk_import_registry_1.getBulkProcessor)(entityType, orgId, userId);
        if (!processor) {
            return res.status(400).json({ message: `Bulk import for entity type '${entityType}' is not supported.` });
        }
        // Parse CSV into array of raw objects
        const rawRows = await new Promise((resolve, reject) => {
            (0, csv_parse_1.parse)(file.buffer, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
                if (err)
                    reject(err);
                else
                    resolve(records);
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
    }
    catch (error) {
        console.error(`[Bulk-Import-Analyze] Error:`, error);
        return res.status(500).json({ message: 'Analyzing CSV failed.', error: error.message });
    }
});
// ==========================================
// 2. COMMIT ROUTE
// ==========================================
// Receives an array of pre-validated JSON objects from the UI (which extracted only the green rows)
// and passes them to the database commit strategy.
router.post('/:entityType/commit', async (req, res) => {
    try {
        const { entityType } = req.params;
        const orgId = req.user.organization_id;
        const userId = req.user.user_id;
        const { validRows, conflictResolutions } = req.body;
        if (!Array.isArray(validRows) || validRows.length === 0) {
            return res.status(400).json({ message: 'No valid rows provided for commit.' });
        }
        const processor = (0, bulk_import_registry_1.getBulkProcessor)(entityType, orgId, userId);
        if (!processor) {
            return res.status(400).json({ message: `Bulk import for entity type '${entityType}' is not supported.` });
        }
        const result = await processor.commit(validRows, conflictResolutions);
        return res.status(200).json({
            message: `Bulk import completed successfully for ${result.success_count} rows.`,
            result
        });
    }
    catch (error) {
        console.error(`[Bulk-Import-Commit] Error:`, error);
        return res.status(500).json({ message: 'Committing valid rows failed.', error: error.message });
    }
});
exports.default = router;
