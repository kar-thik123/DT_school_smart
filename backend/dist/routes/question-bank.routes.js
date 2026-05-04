"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const sync_1 = require("csv-parse/sync");
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const academic_compatibility_service_1 = require("../services/academic-compatibility.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const questionTypeEnum = zod_1.z.enum([
    'MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO',
    'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING',
    'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK',
    'STRUCTURED_5MARK', 'LONG_ANSWER'
]);
const questionSchema = zod_1.z.object({
    subject_id: zod_1.z.string().uuid(),
    unit_id: zod_1.z.string().uuid(),
    topic_id: zod_1.z.string().uuid(),
    question_text: zod_1.z.string().min(1),
    type: questionTypeEnum.default('MCQ_SINGLE'),
    answer: zod_1.z.string().optional(),
    answer_config: zod_1.z.any(), // Will be validated based on type
    marks: zod_1.z.number().min(1),
    difficulty: zod_1.z.enum(['EASY', 'MEDIUM', 'HARD']),
    is_important: zod_1.z.boolean().default(false)
});
// Type-specific validators
const validateConfig = (type, config) => {
    switch (type) {
        case 'MCQ_SINGLE':
            return zod_1.z.object({ options: zod_1.z.array(zod_1.z.string()).min(2), correct_answer: zod_1.z.number() }).parse(config);
        case 'MCQ_MULTI':
            return zod_1.z.object({ options: zod_1.z.array(zod_1.z.string()).min(2), correct_answers: zod_1.z.array(zod_1.z.number()).min(1) }).parse(config);
        case 'TRUE_FALSE':
            return zod_1.z.object({ correct_answer: zod_1.z.boolean() }).parse(config);
        case 'YES_NO':
            return zod_1.z.object({ correct_answer: zod_1.z.enum(['yes', 'no']) }).parse(config);
        case 'FILL_BLANK':
            return zod_1.z.object({ sentence: zod_1.z.string().min(1), blanks: zod_1.z.array(zod_1.z.string()).min(1) }).parse(config);
        // ... we can add more as needed, but for now we trust the generic structure for the rest
        default:
            return config;
    }
};
// Helper: Ensure teacher is assigned
const hasSubjectAccess = async (teacher_id, subject_id, org_id) => {
    return await (0, academic_compatibility_service_1.checkTeacherSubjectAccess)(teacher_id, subject_id, org_id);
};
// Helper: Validate Hierarchy
const validateHierarchy = async (subject_id, unit_id, topic_id, org_id) => {
    const unit = await prisma_1.default.unit.findFirst({
        where: { id: unit_id, organization_id: org_id, OR: [{ subject_id }, { syllabus: { subject_id } }] }
    });
    if (!unit)
        return false;
    const topic = await prisma_1.default.topic.findFirst({
        where: { id: topic_id, unit_id, organization_id: org_id }
    });
    return !!topic;
};
// CREATE SINGLE QUESTION
router.post('/', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'CREATE'), async (req, res) => {
    try {
        const parsed = questionSchema.parse(req.body);
        const org_id = req.user.organization_id;
        const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
        if (!isGlobalAdmin) {
            const canAccess = await hasSubjectAccess(req.user.user_id, parsed.subject_id, org_id);
            if (!canAccess)
                return res.status(403).json({ message: 'Teacher is not assigned to this subject or grade' });
        }
        const isValidHierarchy = await validateHierarchy(parsed.subject_id, parsed.unit_id, parsed.topic_id, org_id);
        if (!isValidHierarchy)
            return res.status(400).json({ message: 'Invalid hierarchy: subject -> unit -> topic mismatch' });
        // Validate type-specific config
        try {
            validateConfig(parsed.type, parsed.answer_config);
        }
        catch (err) {
            return res.status(400).json({ message: 'Invalid answer configuration', errors: err.errors });
        }
        const question = await prisma_1.default.question.create({
            data: {
                ...parsed,
                organization_id: org_id,
                created_by: req.user.user_id,
                answer_config: parsed.answer_config
            }
        });
        res.status(201).json({ message: 'Question created', question });
    }
    catch (error) {
        if (error?.errors)
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        res.status(500).json({ message: 'Server Error' });
    }
});
// READ QUESTIONS
router.get('/', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'READ'), async (req, res) => {
    try {
        const { grade_id, subject_id, difficulty } = req.query;
        const filter = { organization_id: req.user.organization_id };
        if (subject_id)
            filter.subject_id = String(subject_id);
        if (difficulty)
            filter.difficulty = String(difficulty);
        if (grade_id) {
            filter.subject = { grade_id: String(grade_id) };
        }
        const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
        if (!isGlobalAdmin) {
            const assignments = await prisma_1.default.teacherAssignment.findMany({
                where: { teacher_id: req.user.user_id, organization_id: req.user.organization_id }
            });
            const inchargeGradeIds = assignments
                .filter((a) => a.assignment_type === 'CLASS_INCHARGE')
                .map((a) => a.grade_id);
            const specificSubjectIds = assignments
                .filter((a) => a.subject_id)
                .map((a) => a.subject_id);
            const allowedSubjects = await prisma_1.default.subject.findMany({
                where: {
                    organization_id: req.user.organization_id,
                    OR: [
                        { grade_id: { in: inchargeGradeIds } },
                        { id: { in: specificSubjectIds } }
                    ]
                },
                select: { id: true }
            });
            const allowedSubjectIds = allowedSubjects.map((s) => s.id);
            if (filter.subject_id) {
                if (!allowedSubjectIds.includes(filter.subject_id)) {
                    return res.status(403).json({ message: 'Unauthorized access to this subject' });
                }
            }
            else {
                filter.subject_id = { in: allowedSubjectIds };
            }
        }
        const questions = await prisma_1.default.question.findMany({
            where: filter,
            include: {
                subject: { select: { id: true, name: true, grade_id: true } },
                unit: { select: { id: true, name: true } },
                topic: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 100 // pagination placeholder
        });
        res.json(questions);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
// EDIT QUESTION
router.put('/:id', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'EDIT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const existing = await prisma_1.default.question.findFirst({ where: { id: req.params.id, organization_id: org_id } });
        if (!existing)
            return res.status(404).json({ message: 'Question not found' });
        const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
        if (!isGlobalAdmin && existing.created_by !== req.user.user_id) {
            return res.status(403).json({ message: 'Only creator or admins can edit' });
        }
        const parsed = questionSchema.parse(req.body);
        const isValidHierarchy = await validateHierarchy(parsed.subject_id, parsed.unit_id, parsed.topic_id, org_id);
        if (!isValidHierarchy)
            return res.status(400).json({ message: 'Invalid hierarchy' });
        const updated = await prisma_1.default.question.update({
            where: { id: existing.id },
            data: parsed
        });
        res.json({ message: 'Question updated', question: updated });
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating question' });
    }
});
// DELETE QUESTION
router.delete('/:id', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'DELETE'), async (req, res) => {
    try {
        const existing = await prisma_1.default.question.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
        if (!existing)
            return res.status(404).json({ message: 'Question not found' });
        await prisma_1.default.question.delete({ where: { id: existing.id } });
        res.json({ message: 'Question deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting question' });
    }
});
// CSV TEMPLATE DOWNLOAD
router.get('/bulk/template', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'IMPORT'), (req, res) => {
    const header = [
        'grade_name',
        'subject_name',
        'unit_name',
        'topic_name',
        'question_type',
        'question_text',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_option',
        'correct_options',
        'true_false_answer',
        'yes_no_answer',
        'fill_blank_sentence',
        'fill_blank_answers',
        'answer',
        'marks',
        'difficulty',
        'is_important'
    ].join(',');
    const example = [
        'Grade 1',
        'Mathematics',
        'Unit 1 - Numbers',
        'Addition',
        'MCQ_SINGLE',
        'What is 2 + 2?',
        '3',
        '4',
        '5',
        '6',
        'B',
        '',
        '',
        '',
        '',
        '',
        '',
        '1',
        'EASY',
        'false'
    ].join(',');
    const csv = `${header}\n${example}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="question_bank_template.csv"');
    res.send(csv);
});
// ── Smart name normalizers ────────────────────────────────────────────────────
/**
 * Extracts the numeric/ordinal identifier from a grade name so that all of:
 * "Grade 1", "1st", "Std 1", "Standard 1", "Class 1", "1st Grade", "1"
 * resolve to the same string ("1") for comparison.
 */
const normalizeGradeName = (raw) => raw
    .toLowerCase()
    .replace(/\b(grade|standard|std|class|form|level)\b/g, '') // strip label words
    .replace(/\b(st|nd|rd|th)\b/g, '') // strip ordinal suffixes
    .replace(/[^0-9a-z]/g, '') // keep alphanumeric only
    .trim();
/**
 * General name normalizer for subjects, units, and topics.
 * Lowercases, collapses whitespace/hyphens/underscores into a single space.
 */
const normalizeName = (raw) => raw.toLowerCase().replace(/[\s\-_]+/g, ' ').trim();
/**
 * Fuzzy match: checks exact normalized equality first, then falls back to
 * "one name contains the other" to handle prefix/suffix differences
 * e.g. "Unit 1 - Numbers" in DB matching "Numbers" in CSV, or vice-versa.
 */
const fuzzyMatch = (dbName, csvName) => {
    const a = normalizeName(dbName);
    const b = normalizeName(csvName);
    return a === b || a.includes(b) || b.includes(a);
};
// Helper: build answer_config from CSV row based on question type
const buildAnswerConfig = (type, row) => {
    switch (type) {
        case 'MCQ_SINGLE': {
            const opts = ['option_a', 'option_b', 'option_c', 'option_d']
                .map(k => row[k])
                .filter(Boolean);
            const letter = String(row.correct_option || '').trim().toUpperCase();
            const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
            return { options: opts, correct_answer: idx >= 0 ? idx : 0 };
        }
        case 'MCQ_MULTI': {
            const opts = ['option_a', 'option_b', 'option_c', 'option_d']
                .map(k => row[k])
                .filter(Boolean);
            const letters = String(row.correct_options || '').split(',').map((l) => l.trim().toUpperCase());
            const idxs = letters.map((l) => ['A', 'B', 'C', 'D'].indexOf(l)).filter((i) => i >= 0);
            return { options: opts, correct_answers: idxs };
        }
        case 'TRUE_FALSE': {
            const val = String(row.true_false_answer || '').trim().toLowerCase();
            return { correct_answer: val === 'true' };
        }
        case 'YES_NO': {
            const val = String(row.yes_no_answer || '').trim().toLowerCase();
            return { correct_answer: val === 'yes' ? 'yes' : 'no' };
        }
        case 'FILL_BLANK': {
            const sentence = String(row.fill_blank_sentence || '').trim();
            const blanks = String(row.fill_blank_answers || '').split('|').map((b) => b.trim()).filter(Boolean);
            return { sentence, blanks };
        }
        default:
            return {};
    }
};
// BULK UPLOAD (CSV Parse) — auto-creates missing academic hierarchy
router.post('/bulk', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'IMPORT'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ message: 'No file uploaded' });
        const records = (0, sync_1.parse)(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
        if (!records || records.length === 0)
            return res.status(400).json({ message: 'Empty or invalid CSV spreadsheet' });
        const org_id = req.user.organization_id;
        const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
        // ── Resolve active academic year (needed if we must create a grade) ────────
        let activeYear = await prisma_1.default.academicYear.findFirst({
            where: { organization_id: org_id, is_active: true }
        });
        if (!activeYear) {
            const now = new Date();
            activeYear = await prisma_1.default.academicYear.create({
                data: { name: `${now.getFullYear()}-${now.getFullYear() + 1}`, organization_id: org_id, is_active: true }
            });
        }
        const activeYearId = activeYear.id;
        // ── Pre-fetch all org-scoped academic data (mutable arrays — updated as we create) ──
        const allGrades = await prisma_1.default.grade.findMany({ where: { organization_id: org_id }, select: { id: true, name: true } });
        const allSubjects = await prisma_1.default.subject.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
        const allSyllabuses = await prisma_1.default.syllabus.findMany({ where: { organization_id: org_id }, select: { id: true, subject_id: true } });
        const allUnitsRaw = await prisma_1.default.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, subject_id: true, syllabus_id: true } });
        const allTopics = await prisma_1.default.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } });
        // Resolve subject_id for units linked via syllabus
        const syllabusSubjectMap = new Map(allSyllabuses.map(sy => [sy.id, sy.subject_id]));
        const unitsWithSubject = allUnitsRaw.map(u => ({
            id: u.id, name: u.name,
            resolvedSubjectId: u.subject_id ?? (u.syllabus_id ? syllabusSubjectMap.get(u.syllabus_id) ?? null : null)
        }));
        // ── findOrCreate helpers — check in-memory cache first, create in DB if missing ──
        const findOrCreateGrade = async (name) => {
            const found = allGrades.find(g => normalizeGradeName(g.name) === normalizeGradeName(name));
            if (found)
                return found;
            // Create and cache
            const record = await prisma_1.default.grade.create({
                data: { name: name.trim(), academic_year_id: activeYearId, organization_id: org_id }
            });
            const entry = { id: record.id, name: record.name };
            allGrades.push(entry);
            return entry;
        };
        const findOrCreateSubject = async (name, grade_id) => {
            const found = allSubjects.find(s => s.grade_id === grade_id && fuzzyMatch(s.name, name));
            if (found)
                return found;
            const record = await prisma_1.default.subject.create({
                data: { name: name.trim(), grade_id, organization_id: org_id }
            });
            const entry = { id: record.id, name: record.name, grade_id: record.grade_id };
            allSubjects.push(entry);
            return entry;
        };
        const findOrCreateUnit = async (name, subject_id) => {
            const found = unitsWithSubject.find(u => u.resolvedSubjectId === subject_id && fuzzyMatch(u.name, name));
            if (found)
                return found;
            const record = await prisma_1.default.unit.create({
                data: { name: name.trim(), subject_id, organization_id: org_id }
            });
            const entry = { id: record.id, name: record.name, resolvedSubjectId: subject_id };
            unitsWithSubject.push(entry);
            return entry;
        };
        const findOrCreateTopic = async (name, unit_id) => {
            const found = allTopics.find(t => t.unit_id === unit_id && fuzzyMatch(t.name, name));
            if (found)
                return found;
            const record = await prisma_1.default.topic.create({
                data: { name: name.trim(), unit_id, organization_id: org_id }
            });
            const entry = { id: record.id, name: record.name, unit_id: record.unit_id };
            allTopics.push(entry);
            return entry;
        };
        // ── Process rows ──────────────────────────────────────────────────────────
        const results = { created: 0, skipped: 0, autoCreated: { grades: 0, subjects: 0, units: 0, topics: 0 }, errors: [] };
        const prevGradeCount = allGrades.length;
        const prevSubjectCount = allSubjects.length;
        const prevUnitCount = unitsWithSubject.length;
        const prevTopicCount = allTopics.length;
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2; // row 1 = header
            try {
                // ── Required field checks ────────────────────────────────────────────
                const requiredFields = ['grade_name', 'subject_name', 'unit_name', 'topic_name', 'question_text', 'marks', 'difficulty'];
                for (const f of requiredFields) {
                    if (!row[f] || String(row[f]).trim() === '')
                        throw new Error(`Missing required field: "${f}"`);
                }
                const gradeName = String(row.grade_name).trim();
                const subjectName = String(row.subject_name).trim();
                const unitName = String(row.unit_name).trim();
                const topicName = String(row.topic_name).trim();
                // ── Auto-resolve or auto-create academic hierarchy ───────────────────
                const grade = await findOrCreateGrade(gradeName);
                const subject = await findOrCreateSubject(subjectName, grade.id);
                const unit = await findOrCreateUnit(unitName, subject.id);
                const topic = await findOrCreateTopic(topicName, unit.id);
                // ── Type & Config ────────────────────────────────────────────────────
                const rawType = String(row.question_type || 'MCQ_SINGLE').trim().toUpperCase();
                const validTypes = ['MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO', 'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING', 'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK', 'STRUCTURED_5MARK', 'LONG_ANSWER'];
                if (!validTypes.includes(rawType))
                    throw new Error(`Invalid question_type: "${rawType}". Valid: ${validTypes.join(', ')}`);
                const answer_config = buildAnswerConfig(rawType, row);
                try {
                    validateConfig(rawType, answer_config);
                }
                catch {
                    throw new Error(`Invalid answer config for type "${rawType}". Check option_a/b/c/d and correct_option columns.`);
                }
                // ── Difficulty & Marks ───────────────────────────────────────────────
                const diff = String(row.difficulty || '').trim().toUpperCase();
                if (!['EASY', 'MEDIUM', 'HARD'].includes(diff))
                    throw new Error(`Invalid difficulty: "${diff}". Must be EASY, MEDIUM, or HARD`);
                const marks = parseInt(row.marks, 10);
                if (isNaN(marks) || marks < 1)
                    throw new Error(`Invalid marks: "${row.marks}". Must be a positive integer.`);
                // ── Teacher access check ─────────────────────────────────────────────
                if (!isGlobalAdmin) {
                    const canAccess = await hasSubjectAccess(req.user.user_id, subject.id, org_id);
                    if (!canAccess)
                        throw new Error(`Not authorized to upload questions for subject "${subjectName}"`);
                }
                await prisma_1.default.question.create({
                    data: {
                        subject_id: subject.id,
                        unit_id: unit.id,
                        topic_id: topic.id,
                        question_text: String(row.question_text).trim(),
                        type: rawType,
                        answer: row.answer ? String(row.answer).trim() : undefined,
                        answer_config,
                        marks,
                        difficulty: diff,
                        is_important: String(row.is_important || 'false').toLowerCase() === 'true',
                        organization_id: org_id,
                        created_by: req.user.user_id
                    }
                });
                results.created++;
            }
            catch (err) {
                results.skipped++;
                results.errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
            }
        }
        // Count auto-created items
        results.autoCreated.grades = allGrades.length - prevGradeCount;
        results.autoCreated.subjects = allSubjects.length - prevSubjectCount;
        results.autoCreated.units = unitsWithSubject.length - prevUnitCount;
        results.autoCreated.topics = allTopics.length - prevTopicCount;
        const autoMsg = Object.entries(results.autoCreated)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${v} ${k}`)
            .join(', ');
        res.status(201).json({
            message: `Bulk upload completed. ${results.created} questions created, ${results.skipped} skipped.${autoMsg ? ` Auto-created: ${autoMsg}.` : ''}`,
            results
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to process file', error: error.message });
    }
});
exports.default = router;
