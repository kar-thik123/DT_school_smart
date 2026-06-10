"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const sync_1 = require("csv-parse/sync");
const crypto_1 = require("crypto");
const upload = (0, multer_1.default)();
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// ─── Zod Schemas ────────────────────────────────────────────────────────────
const uuidSchema = zod_1.z.string().uuid();
const createUnitSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Unit name is required').max(255),
    grade_id: zod_1.z.string().uuid('Invalid grade_id'),
    section_id: zod_1.z.string().uuid('Invalid section_id').or(zod_1.z.literal('ALL')),
    subject_id: zod_1.z.string().uuid('Invalid subject_id'),
    order_index: zod_1.z.number().int().min(0).optional(),
});
const updateUnitSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    order_index: zod_1.z.number().int().min(0).optional(),
});
const createTopicSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Topic name is required').max(255),
    unit_id: zod_1.z.string().uuid('Invalid unit_id'),
    order_index: zod_1.z.number().int().min(0).optional(),
});
const updateTopicSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    order_index: zod_1.z.number().int().min(0).optional(),
});
const createSubTopicSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Sub topic name is required').max(255),
    topic_id: zod_1.z.string().uuid('Invalid topic_id'),
    order_index: zod_1.z.number().int().min(0).optional(),
});
const updateSubTopicSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    order_index: zod_1.z.number().int().min(0).optional(),
});
// ─── Shared helpers ─────────────────────────────────────────────────────────
function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
function parseSearch(query) {
    return query.search ? String(query.search).trim() : undefined;
}
function parseSortField(query, allowed, defaultField) {
    const field = allowed.includes(query.sort_by) ? query.sort_by : defaultField;
    const order = query.sort_order === 'desc' ? 'desc' : 'asc';
    return { field, order };
}
// ═══════════════════════════════════════════════════════════════════════════
//  UNITS CRUD
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/curriculum/units
router.post('/units', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const parsed = createUnitSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
        }
        const org_id = req.user.organization_id;
        const { name, grade_id, section_id, subject_id, order_index } = parsed.data;
        // Verify grade, section, subject belong to org
        const [grade, subject] = await Promise.all([
            prisma_1.default.grade.findFirst({ where: { id: grade_id, organization_id: org_id } }),
            prisma_1.default.subject.findFirst({ where: { id: subject_id, organization_id: org_id } }),
        ]);
        if (!grade)
            return res.status(404).json({ message: 'Grade not found in your organization' });
        if (!subject)
            return res.status(404).json({ message: 'Subject not found in your organization' });
        let dbSectionId = null;
        if (section_id !== 'ALL') {
            const section = await prisma_1.default.section.findFirst({ where: { id: section_id, organization_id: org_id } });
            if (!section)
                return res.status(404).json({ message: 'Section not found in your organization' });
            dbSectionId = section_id;
        }
        // Auto-calculate order_index if not provided
        let finalOrderIndex = order_index;
        if (finalOrderIndex === undefined) {
            const maxOrder = await prisma_1.default.unit.aggregate({
                where: { organization_id: org_id, grade_id, section_id: dbSectionId, subject_id },
                _max: { order_index: true },
            });
            finalOrderIndex = (maxOrder._max.order_index ?? -1) + 1;
        }
        const unit = await prisma_1.default.unit.create({
            data: {
                name,
                grade_id,
                section_id: dbSectionId,
                subject_id,
                organization_id: org_id,
                order_index: finalOrderIndex,
            },
            include: {
                grade: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } },
            },
        });
        res.status(201).json({ message: 'Unit created successfully', data: unit });
    }
    catch (error) {
        console.error('[curriculum/units] CREATE error:', error.message);
        res.status(500).json({ message: 'Failed to create unit', error: error.message });
    }
});
// GET /api/curriculum/units
router.get('/units', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { page, limit, skip } = parsePagination(req.query);
        const search = parseSearch(req.query);
        const sort = parseSortField(req.query, ['name', 'order_index', 'created_at'], 'order_index');
        const where = { organization_id: org_id };
        const andConditions = [];
        // Filters
        if (req.query.grade_id)
            where.grade_id = String(req.query.grade_id);
        if (req.query.subject_id)
            where.subject_id = String(req.query.subject_id);
        if (req.query.section_id) {
            andConditions.push({
                OR: [
                    { section_id: String(req.query.section_id) },
                    { section_id: null }
                ]
            });
        }
        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                ]
            });
        }
        if (andConditions.length > 0) {
            where.AND = andConditions;
        }
        const [data, total] = await Promise.all([
            prisma_1.default.unit.findMany({
                where,
                include: {
                    grade: { select: { id: true, name: true } },
                    section: { select: { id: true, name: true } },
                    subject: { select: { id: true, name: true } },
                    _count: { select: { topics: true } },
                },
                orderBy: { [sort.field]: sort.order },
                skip,
                take: limit,
            }),
            prisma_1.default.unit.count({ where }),
        ]);
        res.json({
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('[curriculum/units] GET error:', error.message);
        res.status(500).json({ message: 'Failed to fetch units', error: error.message });
    }
});
// GET /api/curriculum/units/:id
router.get('/units/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const unit = await prisma_1.default.unit.findFirst({
            where: { id: req.params.id, organization_id: org_id },
            include: {
                grade: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } },
                topics: { orderBy: { order_index: 'asc' }, include: { _count: { select: { sub_topics: true } } } },
            },
        });
        if (!unit)
            return res.status(404).json({ message: 'Unit not found' });
        res.json(unit);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch unit', error: error.message });
    }
});
// PATCH /api/curriculum/units/:id
router.patch('/units/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const existing = await prisma_1.default.unit.findFirst({ where: { id: req.params.id, organization_id: org_id } });
        if (!existing)
            return res.status(404).json({ message: 'Unit not found' });
        const parsed = updateUnitSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
        }
        const unit = await prisma_1.default.unit.update({
            where: { id: req.params.id },
            data: parsed.data,
            include: {
                grade: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } },
            },
        });
        res.json({ message: 'Unit updated successfully', data: unit });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update unit', error: error.message });
    }
});
// DELETE /api/curriculum/units/:id
router.delete('/units/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const existing = await prisma_1.default.unit.findFirst({ where: { id: req.params.id, organization_id: org_id } });
        if (!existing)
            return res.status(404).json({ message: 'Unit not found' });
        await prisma_1.default.unit.delete({ where: { id: req.params.id } });
        res.json({ message: 'Unit deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete unit', error: error.message });
    }
});
// ═══════════════════════════════════════════════════════════════════════════
//  TOPICS CRUD
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/curriculum/topics
router.post('/topics', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const parsed = createTopicSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
        }
        const org_id = req.user.organization_id;
        const { name, unit_id, order_index } = parsed.data;
        const unit = await prisma_1.default.unit.findFirst({ where: { id: unit_id, organization_id: org_id } });
        if (!unit)
            return res.status(404).json({ message: 'Unit not found in your organization' });
        let finalOrderIndex = order_index;
        if (finalOrderIndex === undefined) {
            const maxOrder = await prisma_1.default.topic.aggregate({
                where: { organization_id: org_id, unit_id },
                _max: { order_index: true },
            });
            finalOrderIndex = (maxOrder._max.order_index ?? -1) + 1;
        }
        const topic = await prisma_1.default.topic.create({
            data: {
                name,
                unit_id,
                organization_id: org_id,
                order_index: finalOrderIndex,
            },
            include: {
                unit: { select: { id: true, name: true } },
            },
        });
        res.status(201).json({ message: 'Topic created successfully', data: topic });
    }
    catch (error) {
        console.error('[curriculum/topics] CREATE error:', error.message);
        res.status(500).json({ message: 'Failed to create topic', error: error.message });
    }
});
// GET /api/curriculum/topics
router.get('/topics', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { page, limit, skip } = parsePagination(req.query);
        const search = parseSearch(req.query);
        const sort = parseSortField(req.query, ['name', 'order_index', 'created_at'], 'order_index');
        const where = { organization_id: org_id };
        if (req.query.unit_id) {
            const ids = String(req.query.unit_id).split(',');
            where.unit_id = ids.length > 1 ? { in: ids } : ids[0];
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            prisma_1.default.topic.findMany({
                where,
                include: {
                    unit: { select: { id: true, name: true } },
                    _count: { select: { sub_topics: true } },
                },
                orderBy: { [sort.field]: sort.order },
                skip,
                take: limit,
            }),
            prisma_1.default.topic.count({ where }),
        ]);
        res.json({
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('[curriculum/topics] GET error:', error.message);
        res.status(500).json({ message: 'Failed to fetch topics', error: error.message });
    }
});
// GET /api/curriculum/topics/:id
router.get('/topics/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const topic = await prisma_1.default.topic.findFirst({
            where: { id: req.params.id, organization_id: org_id },
            include: {
                unit: { select: { id: true, name: true } },
                sub_topics: { orderBy: { order_index: 'asc' } },
            },
        });
        if (!topic)
            return res.status(404).json({ message: 'Topic not found' });
        res.json(topic);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch topic', error: error.message });
    }
});
// PATCH /api/curriculum/topics/:id
router.patch('/topics/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const existing = await prisma_1.default.topic.findFirst({ where: { id: req.params.id, organization_id: org_id } });
        if (!existing)
            return res.status(404).json({ message: 'Topic not found' });
        const parsed = updateTopicSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
        }
        const topic = await prisma_1.default.topic.update({
            where: { id: req.params.id },
            data: parsed.data,
            include: { unit: { select: { id: true, name: true } } },
        });
        res.json({ message: 'Topic updated successfully', data: topic });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update topic', error: error.message });
    }
});
// DELETE /api/curriculum/topics/:id
router.delete('/topics/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const existing = await prisma_1.default.topic.findFirst({ where: { id: req.params.id, organization_id: org_id } });
        if (!existing)
            return res.status(404).json({ message: 'Topic not found' });
        await prisma_1.default.topic.delete({ where: { id: req.params.id } });
        res.json({ message: 'Topic deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete topic', error: error.message });
    }
});
// ═══════════════════════════════════════════════════════════════════════════
//  SUBTOPICS CRUD
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/curriculum/subtopics
router.post('/subtopics', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const parsed = createSubTopicSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
        }
        const org_id = req.user.organization_id;
        const { name, topic_id, order_index } = parsed.data;
        const topic = await prisma_1.default.topic.findFirst({ where: { id: topic_id, organization_id: org_id } });
        if (!topic)
            return res.status(404).json({ message: 'Topic not found in your organization' });
        let finalOrderIndex = order_index;
        if (finalOrderIndex === undefined) {
            const maxOrder = await prisma_1.default.subTopic.aggregate({
                where: { organization_id: org_id, topic_id },
                _max: { order_index: true },
            });
            finalOrderIndex = (maxOrder._max.order_index ?? -1) + 1;
        }
        const subTopic = await prisma_1.default.subTopic.create({
            data: {
                name,
                topic_id,
                organization_id: org_id,
                order_index: finalOrderIndex,
            },
            include: {
                topic: { select: { id: true, name: true } },
            },
        });
        res.status(201).json({ message: 'Sub topic created successfully', data: subTopic });
    }
    catch (error) {
        console.error('[curriculum/subtopics] CREATE error:', error.message);
        res.status(500).json({ message: 'Failed to create sub topic', error: error.message });
    }
});
// GET /api/curriculum/subtopics
router.get('/subtopics', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { page, limit, skip } = parsePagination(req.query);
        const search = parseSearch(req.query);
        const sort = parseSortField(req.query, ['name', 'order_index', 'created_at'], 'order_index');
        const where = { organization_id: org_id };
        if (req.query.topic_id) {
            const ids = String(req.query.topic_id).split(',');
            where.topic_id = ids.length > 1 ? { in: ids } : ids[0];
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            prisma_1.default.subTopic.findMany({
                where,
                include: {
                    topic: { select: { id: true, name: true } },
                },
                orderBy: { [sort.field]: sort.order },
                skip,
                take: limit,
            }),
            prisma_1.default.subTopic.count({ where }),
        ]);
        res.json({
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('[curriculum/subtopics] GET error:', error.message);
        res.status(500).json({ message: 'Failed to fetch sub topics', error: error.message });
    }
});
// GET /api/curriculum/subtopics/:id
router.get('/subtopics/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const subTopic = await prisma_1.default.subTopic.findFirst({
            where: { id: req.params.id, organization_id: org_id },
            include: { topic: { select: { id: true, name: true } } },
        });
        if (!subTopic)
            return res.status(404).json({ message: 'Sub topic not found' });
        res.json(subTopic);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch sub topic', error: error.message });
    }
});
// PATCH /api/curriculum/subtopics/:id
router.patch('/subtopics/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const existing = await prisma_1.default.subTopic.findFirst({ where: { id: req.params.id, organization_id: org_id } });
        if (!existing)
            return res.status(404).json({ message: 'Sub topic not found' });
        const parsed = updateSubTopicSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
        }
        const subTopic = await prisma_1.default.subTopic.update({
            where: { id: req.params.id },
            data: parsed.data,
            include: { topic: { select: { id: true, name: true } } },
        });
        res.json({ message: 'Sub topic updated successfully', data: subTopic });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update sub topic', error: error.message });
    }
});
// DELETE /api/curriculum/subtopics/:id
router.delete('/subtopics/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const existing = await prisma_1.default.subTopic.findFirst({ where: { id: req.params.id, organization_id: org_id } });
        if (!existing)
            return res.status(404).json({ message: 'Sub topic not found' });
        await prisma_1.default.subTopic.delete({ where: { id: req.params.id } });
        res.json({ message: 'Sub topic deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete sub topic', error: error.message });
    }
});
const bulkRouter = (0, express_1.Router)();
bulkRouter.use(auth_middleware_1.authMiddleware);
// POST /api/curriculum/bulk/preview
bulkRouter.post('/preview', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ message: 'No file uploaded' });
        const records = (0, sync_1.parse)(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
        if (!records || records.length === 0)
            return res.status(400).json({ message: 'Empty or invalid CSV file' });
        const org_id = req.user.organization_id;
        const session_id = (0, crypto_1.randomUUID)();
        const resolvedRows = [];
        // Fetch active academic year
        const activeYear = await prisma_1.default.academicYear.findFirst({ where: { organization_id: org_id, is_active: true } });
        const yearCondition = activeYear ? { academic_year_id: activeYear.id } : {};
        const gradeCondition = activeYear ? { grade: { academic_year_id: activeYear.id } } : {};
        // existing academic structure for current active year
        const existingGrades = await prisma_1.default.grade.findMany({ where: { organization_id: org_id, ...yearCondition }, select: { id: true, name: true } });
        const existingSections = await prisma_1.default.section.findMany({ where: { organization_id: org_id, ...gradeCondition }, select: { id: true, name: true, grade_id: true } });
        const existingSubjects = await prisma_1.default.subject.findMany({ where: { organization_id: org_id, ...gradeCondition }, select: { id: true, name: true, grade_id: true } });
        const existingSubjectGroups = await prisma_1.default.subjectGroup.findMany({ where: { organization_id: org_id, ...gradeCondition }, include: { subjects: true } });
        const existingUnits = await prisma_1.default.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true, section_id: true, subject_id: true } });
        const existingTopics = await prisma_1.default.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } });
        const existingSubTopics = await prisma_1.default.subTopic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, topic_id: true } });
        const seenRows = new Set();
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2;
            const isEmptyRow = Object.values(row).every(val => !val || String(val).trim() === '');
            if (isEmptyRow)
                continue;
            const errors = [];
            let match_status = 'NOT_VALID';
            const gradeName = String(row.Grade || '').trim();
            const gradeNameClean = gradeName.replace(/^grade\\s*/i, '').trim();
            let sectionName = String(row.Section || '').trim();
            if (sectionName.toLowerCase() === 'all sections') {
                sectionName = '';
            }
            const subjectName = String(row.Subject || '').trim();
            const unitName = String(row['Unit Name'] || '').trim();
            const topicName = String(row['Topic Name'] || '').trim();
            const subTopicName = String(row['Sub Topic Name'] || '').trim();
            if (!gradeNameClean)
                errors.push('Grade is required');
            if (!subjectName)
                errors.push('Subject is required');
            if (!unitName)
                errors.push('Unit Name is required');
            let resolvedGradeId = null;
            let resolvedSectionId = null;
            let resolvedSubjectId = null;
            const grade = existingGrades.find((g) => g.name.trim().toLowerCase() === gradeNameClean.toLowerCase());
            if (grade) {
                resolvedGradeId = grade.id;
                if (sectionName) {
                    const section = existingSections.find((s) => s.grade_id === grade.id && s.name.trim().toLowerCase() === sectionName.toLowerCase());
                    if (!section)
                        errors.push(`Section "${sectionName}" not found in Grade "${gradeName}"`);
                    else
                        resolvedSectionId = section.id;
                }
                let subject = existingSubjects.find((s) => s.grade_id === grade.id && s.name.trim().toLowerCase() === subjectName.toLowerCase());
                if (!subject) {
                    subject = existingSubjects.find((s) => s.name.trim().toLowerCase() === subjectName.toLowerCase());
                }
                if (!subject) {
                    errors.push(`Subject "${subjectName}" not found in Grade "${gradeName}"`);
                }
                else {
                    resolvedSubjectId = subject.id;
                    // Check against the Academic Structure Hierarchy
                    if (resolvedSectionId) {
                        const isSubjectMappedToSection = existingSubjectGroups.some((grp) => grp.grade_id === resolvedGradeId &&
                            grp.section_id === resolvedSectionId &&
                            grp.subjects.some((subLink) => subLink.subject_id === resolvedSubjectId));
                        if (!isSubjectMappedToSection) {
                            errors.push(`Subject "${subjectName}" is not mapped to Section "${sectionName}" in the academic hierarchy`);
                        }
                    }
                }
            }
            else {
                if (gradeName)
                    errors.push(`Grade "${gradeName}" not found in system`);
            }
            if (errors.length === 0) {
                match_status = 'VALID';
                const compositeKey = [gradeNameClean, sectionName, subjectName, unitName, topicName, subTopicName].join('|');
                if (seenRows.has(compositeKey)) {
                    match_status = 'DUPLICATE';
                }
                else {
                    seenRows.add(compositeKey);
                    // Check against DB (case-sensitive)
                    let currentUnitId = existingUnits.find((u) => u.grade_id === resolvedGradeId && u.subject_id === resolvedSubjectId && (u.section_id === resolvedSectionId || (!u.section_id && !resolvedSectionId)) && u.name === unitName)?.id;
                    if (subTopicName && topicName && unitName) {
                        if (currentUnitId) {
                            const currentTopicId = existingTopics.find((t) => t.unit_id === currentUnitId && t.name === topicName)?.id;
                            if (currentTopicId) {
                                const currentSubTopic = existingSubTopics.find((st) => st.topic_id === currentTopicId && st.name === subTopicName);
                                if (currentSubTopic)
                                    match_status = 'DUPLICATE';
                            }
                        }
                    }
                    else if (topicName && unitName) {
                        if (currentUnitId) {
                            const currentTopic = existingTopics.find((t) => t.unit_id === currentUnitId && t.name === topicName);
                            if (currentTopic)
                                match_status = 'DUPLICATE';
                        }
                    }
                    else if (unitName) {
                        if (currentUnitId)
                            match_status = 'DUPLICATE';
                    }
                }
            }
            resolvedRows.push({
                row_number: rowNum,
                raw_data: row,
                match_status,
                resolved_data: { errors, grade_id: resolvedGradeId, section_id: resolvedSectionId, subject_id: resolvedSubjectId }
            });
        }
        const previewData = resolvedRows.map((r) => ({
            session_id,
            organization_id: org_id,
            created_by: req.user.user_id,
            row_number: r.row_number,
            raw_data: r.raw_data,
            match_status: r.match_status,
            resolved_data: r.resolved_data
        }));
        if (previewData.length > 0) {
            await prisma_1.default.previewImportData.createMany({ data: previewData });
        }
        const summary = {
            total: resolvedRows.length,
            valid: resolvedRows.filter(r => r.match_status === 'VALID').length,
            duplicate: resolvedRows.filter(r => r.match_status === 'DUPLICATE').length,
            validation_error: resolvedRows.filter(r => r.match_status === 'NOT_VALID').length,
        };
        res.status(201).json({
            message: 'Preview generated successfully',
            session_id,
            summary,
            records: resolvedRows.map(r => ({
                ...r,
                created_by_name: req.user.name || 'System',
                created_date: new Date().toISOString()
            }))
        });
    }
    catch (error) {
        console.error('[curriculum/bulk/preview] Error:', error);
        res.status(500).json({ message: 'Failed to process preview', error: error.message });
    }
});
// POST /api/curriculum/bulk/confirm
bulkRouter.post('/confirm', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const { session_id, modified_records } = req.body;
        if (!session_id)
            return res.status(400).json({ message: 'Missing session_id' });
        const org_id = req.user.organization_id;
        // Load preview data
        const storedPreview = await prisma_1.default.previewImportData.findMany({
            where: { session_id, organization_id: org_id, created_by: req.user.user_id }
        });
        if (!storedPreview.length)
            return res.status(404).json({ message: 'Session expired or not found' });
        // Incorporate modifications if provided
        let recordsToProcess = storedPreview;
        if (modified_records && Array.isArray(modified_records)) {
            const modifiedMap = new Map(modified_records.map(r => [r.row_number, r]));
            recordsToProcess = storedPreview.map((p) => {
                const mod = modifiedMap.get(p.row_number);
                if (mod) {
                    return { ...p, raw_data: mod.raw_data, match_status: mod.match_status, resolved_data: mod.resolved_data };
                }
                return p;
            });
        }
        // Filter valid rows only
        const validRows = recordsToProcess.filter((r) => r.match_status === 'VALID');
        if (validRows.length === 0)
            return res.status(400).json({ message: 'No valid records to import.' });
        await prisma_1.default.$transaction(async (tx) => {
            // Process logically row by row to maintain relations (Units -> Topics -> SubTopics)
            const unitCache = new Map();
            const topicCache = new Map();
            for (const row of validRows) {
                const { Grade, Section, Subject, 'Unit Name': unitName, 'Topic Name': topicName, 'Sub Topic Name': subTopicName } = row.raw_data;
                const resolvedData = typeof row.resolved_data === 'string' ? JSON.parse(row.resolved_data) : row.resolved_data;
                const gradeId = resolvedData.grade_id;
                const sectionId = resolvedData.section_id || null;
                const subjectId = resolvedData.subject_id;
                if (!gradeId || !subjectId || !unitName)
                    continue;
                const unitKey = `${gradeId}|${sectionId || ''}|${subjectId}|${unitName}`;
                let unitId = unitCache.get(unitKey);
                if (!unitId) {
                    let unit = await tx.unit.findFirst({
                        where: { organization_id: org_id, grade_id: gradeId, section_id: sectionId, subject_id: subjectId, name: unitName }
                    });
                    if (!unit) {
                        const maxU = await tx.unit.aggregate({ where: { organization_id: org_id, grade_id: gradeId, section_id: sectionId, subject_id: subjectId }, _max: { order_index: true } });
                        unit = await tx.unit.create({
                            data: {
                                name: unitName,
                                grade_id: gradeId,
                                section_id: sectionId,
                                subject_id: subjectId,
                                organization_id: org_id,
                                order_index: (maxU._max.order_index ?? -1) + 1
                            }
                        });
                    }
                    unitId = unit.id;
                    unitCache.set(unitKey, unitId);
                }
                if (topicName && unitId) {
                    const topicKey = `${unitId}|${topicName}`;
                    let topicId = topicCache.get(topicKey);
                    if (!topicId) {
                        let topic = await tx.topic.findFirst({
                            where: { organization_id: org_id, unit_id: unitId, name: topicName }
                        });
                        if (!topic) {
                            const maxT = await tx.topic.aggregate({ where: { organization_id: org_id, unit_id: unitId }, _max: { order_index: true } });
                            topic = await tx.topic.create({
                                data: {
                                    name: topicName,
                                    unit_id: unitId,
                                    organization_id: org_id,
                                    order_index: (maxT._max.order_index ?? -1) + 1
                                }
                            });
                        }
                        topicId = topic.id;
                        topicCache.set(topicKey, topicId);
                    }
                    if (subTopicName && topicId) {
                        const subTopic = await tx.subTopic.findFirst({
                            where: { organization_id: org_id, topic_id: topicId, name: subTopicName }
                        });
                        if (!subTopic) {
                            const maxST = await tx.subTopic.aggregate({ where: { organization_id: org_id, topic_id: topicId }, _max: { order_index: true } });
                            await tx.subTopic.create({
                                data: {
                                    name: subTopicName,
                                    topic_id: topicId,
                                    organization_id: org_id,
                                    order_index: (maxST._max.order_index ?? -1) + 1
                                }
                            });
                        }
                    }
                }
            }
        }, {
            timeout: 60000,
            maxWait: 5000
        });
        // Cleanup preview data
        await prisma_1.default.previewImportData.deleteMany({
            where: { session_id, organization_id: org_id }
        });
        res.json({ message: 'Curriculum imported successfully' });
    }
    catch (error) {
        console.error('[curriculum/bulk/confirm] Error:', error);
        res.status(500).json({ message: 'Failed to import curriculum', error: error.message });
    }
});
// POST /api/curriculum/bulk/discard
bulkRouter.post('/discard', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const { session_id } = req.body;
        if (!session_id)
            return res.status(400).json({ message: 'Missing session_id' });
        await prisma_1.default.previewImportData.deleteMany({
            where: { session_id, organization_id: req.user.organization_id, created_by: req.user.user_id }
        });
        res.json({ message: 'Preview discarded' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to discard preview', error: error.message });
    }
});
router.use('/bulk', bulkRouter);
exports.default = router;
