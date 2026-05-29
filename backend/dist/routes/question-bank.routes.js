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
const academic_helper_1 = require("../utils/academic-helper");
const academic_compatibility_service_1 = require("../services/academic-compatibility.service");
const audit_service_1 = require("../services/audit.service");
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
    subject_id: zod_1.z.string().uuid().nullable().optional(),
    unit_id: zod_1.z.string().uuid().nullable().optional(),
    topic_id: zod_1.z.string().uuid().nullable().optional(),
    sub_topic_id: zod_1.z.string().uuid().nullable().optional(),
    grade_id: zod_1.z.string().uuid().nullable().optional(),
    section_id: zod_1.z.string().uuid().nullable().optional(),
    question_text: zod_1.z.string().min(1),
    type: questionTypeEnum.default('MCQ_SINGLE'),
    answer: zod_1.z.string().optional(),
    answer_config: zod_1.z.any(), // Will be validated based on type
    marks: zod_1.z.number().min(1),
    difficulty: zod_1.z.enum(['EASY', 'MEDIUM', 'HARD']),
    is_important: zod_1.z.boolean().default(false),
    is_repeated: zod_1.z.boolean().default(false)
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
const validateHierarchy = async (subject_id, unit_id, topic_id, sub_topic_id, org_id) => {
    if (unit_id) {
        if (!subject_id)
            return false;
        const unit = await prisma_1.default.unit.findFirst({
            where: { id: unit_id, organization_id: org_id, OR: [{ subject_id }, { syllabus: { subject_id } }] }
        });
        if (!unit)
            return false;
    }
    if (topic_id) {
        if (!unit_id)
            return false;
        const topic = await prisma_1.default.topic.findFirst({
            where: { id: topic_id, unit_id, organization_id: org_id }
        });
        if (!topic)
            return false;
    }
    if (sub_topic_id) {
        if (!topic_id)
            return false;
        const subTopic = await prisma_1.default.subTopic.findFirst({
            where: { id: sub_topic_id, topic_id, organization_id: org_id }
        });
        return !!subTopic;
    }
    return true;
};
// CREATE SINGLE QUESTION
router.post('/', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'CREATE'), async (req, res) => {
    try {
        const parsed = questionSchema.parse(req.body);
        const org_id = req.user.organization_id;
        const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
        if (!isGlobalAdmin) {
            if (parsed.subject_id) {
                const canAccess = await hasSubjectAccess(req.user.user_id, parsed.subject_id, org_id);
                if (!canAccess)
                    return res.status(403).json({ message: 'Unauthorized access to this subject' });
            }
        }
        const isValidHierarchy = await validateHierarchy(parsed.subject_id, parsed.unit_id, parsed.topic_id, parsed.sub_topic_id, org_id);
        if (!isValidHierarchy)
            return res.status(400).json({ message: 'Invalid hierarchy: subject -> unit -> topic -> sub_topic mismatch' });
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
            },
            include: {
                creator: { select: { id: true, name: true } }
            }
        });
        await (0, audit_service_1.logAuditEvent)({
            organization_id: org_id,
            user_id: req.user.user_id,
            user_name: req.user.name,
            action_type: 'CREATE',
            entity_type: 'QUESTION',
            entity_id: question.id,
            metadata: { subject_id: question.subject_id, grade_id: question.grade_id }
        });
        res.status(201).json({ message: 'Question created', question });
    }
    catch (error) {
        if (error?.errors)
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        console.error('[Question Create Error]', error);
        res.status(500).json({ message: 'Server Error', detail: error?.message });
    }
});
// READ QUESTIONS
router.get('/', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'READ'), async (req, res) => {
    try {
        const { grade_id, subject_id, difficulty, section_id, unit_id, topic_id, sub_topic_id } = req.query;
        const filter = { organization_id: req.user.organization_id };
        if (subject_id)
            filter.subject_id = String(subject_id);
        if (difficulty)
            filter.difficulty = String(difficulty);
        if (section_id)
            filter.section_id = String(section_id);
        if (unit_id)
            filter.unit_id = String(unit_id);
        if (topic_id)
            filter.topic_id = String(topic_id);
        if (sub_topic_id)
            filter.sub_topic_id = String(sub_topic_id);
        if (grade_id) {
            filter.OR = [
                { grade_id: String(grade_id) },
                { subject: { grade_id: String(grade_id) } }
            ];
        }
        const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
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
                const authFilter = {
                    OR: [
                        { subject_id: { in: allowedSubjectIds } },
                        { subject_id: null, grade_id: { in: inchargeGradeIds } }
                    ]
                };
                if (filter.OR) {
                    filter.AND = [
                        { OR: filter.OR },
                        authFilter
                    ];
                    delete filter.OR;
                }
                else {
                    filter.OR = authFilter.OR;
                }
            }
        }
        const questions = await prisma_1.default.question.findMany({
            where: filter,
            include: {
                subject: { select: { id: true, name: true, grade_id: true } },
                unit: { select: { id: true, name: true } },
                topic: { select: { id: true, name: true } },
                sub_topic: { select: { id: true, name: true } },
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
        const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
        if (!isGlobalAdmin && existing.created_by !== req.user.user_id) {
            return res.status(403).json({ message: 'Only creator or admins can edit' });
        }
        const parsed = questionSchema.parse(req.body);
        if (!isGlobalAdmin && parsed.subject_id) {
            const canAccess = await hasSubjectAccess(req.user.user_id, parsed.subject_id, org_id);
            if (!canAccess) {
                return res.status(403).json({ message: 'Teacher is not assigned to this subject or grade' });
            }
        }
        const isValidHierarchy = await validateHierarchy(parsed.subject_id, parsed.unit_id, parsed.topic_id, parsed.sub_topic_id, org_id);
        if (!isValidHierarchy)
            return res.status(400).json({ message: 'Invalid hierarchy' });
        const updated = await prisma_1.default.question.update({
            where: { id: existing.id },
            data: parsed
        });
        await (0, audit_service_1.logAuditEvent)({
            organization_id: org_id,
            user_id: req.user.user_id,
            user_name: req.user.name,
            action_type: 'UPDATE',
            entity_type: 'QUESTION',
            entity_id: updated.id,
            metadata: { subject_id: updated.subject_id, grade_id: updated.grade_id }
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
        const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
        if (!isGlobalAdmin && existing.created_by !== req.user.user_id) {
            return res.status(403).json({ message: 'Only creator or admins can delete' });
        }
        await prisma_1.default.question.delete({ where: { id: existing.id } });
        await (0, audit_service_1.logAuditEvent)({
            organization_id: req.user.organization_id,
            user_id: req.user.user_id,
            user_name: req.user.name,
            action_type: 'DELETE',
            entity_type: 'QUESTION',
            entity_id: existing.id,
            metadata: { subject_id: existing.subject_id, grade_id: existing.grade_id }
        });
        res.json({ message: 'Question deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting question' });
    }
});
// CSV TEMPLATE DOWNLOAD
router.get('/bulk/template', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'IMPORT'), (req, res) => {
    const header = [
        'board',
        'medium',
        'grade',
        'subject',
        'unit_lesson',
        'topic',
        'question_type',
        'question',
        'option1',
        'option2',
        'option3',
        'option4',
        'answer',
        'marks',
        'difficulty_level',
        'important_question',
        'repeated_question',
        'prepared_by'
    ].join(',');
    const example = [
        'State',
        'English',
        '6',
        'Math',
        'Algebra',
        'Linear Eq',
        'mcq',
        '2x+4=10 x=?',
        '2',
        '3',
        '4',
        '5',
        '3',
        '1',
        'easy',
        'TRUE',
        'FALSE',
        'Admin'
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
        case 'MCQ_SINGLE':
        case 'MCQ': {
            const opts = ['option1', 'option2', 'option3', 'option4']
                .map(k => row[k])
                .filter(Boolean);
            // Let's assume correct answer might be index or value
            const ans = String(row.answer || '').trim();
            let idx = parseInt(ans, 10);
            if (isNaN(idx) || idx < 1 || idx > 4) {
                idx = opts.indexOf(ans) + 1; // Try matching text
            }
            return { options: opts, correct_answer: (idx > 0) ? (idx - 1) : 0 };
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
const crypto_1 = require("crypto");
// BULK PREVIEW — simplified validation without hierarchy matching
router.post('/bulk/preview', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'IMPORT'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ message: 'No file uploaded' });
        const records = (0, sync_1.parse)(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
        if (!records || records.length === 0)
            return res.status(400).json({ message: 'Empty or invalid CSV spreadsheet' });
        const org_id = req.user.organization_id;
        const session_id = (0, crypto_1.randomUUID)();
        const existingQuestions = await prisma_1.default.question.findMany({
            where: { organization_id: org_id },
            select: {
                question_text: true,
                grade: { select: { name: true } },
                section: { select: { name: true } },
                subject: { select: { name: true } },
                unit: { select: { name: true } },
                topic: { select: { name: true } },
                sub_topic: { select: { name: true } },
                answer: true,
                answer_config: true,
                marks: true,
                difficulty: true
            }
        });
        const getCompositeKey = (q) => [
            String(q.grade || '').trim().toLowerCase(),
            String(q.section || '').trim().toLowerCase(),
            String(q.subject || '').trim().toLowerCase(),
            String(q.unit || '').trim().toLowerCase(),
            String(q.topic || '').trim().toLowerCase(),
            String(q.sub_topic || '').trim().toLowerCase(),
            String(q.question || '').trim().toLowerCase(),
            String(q.options || '').trim().toLowerCase(),
            String(q.answer || '').trim().toLowerCase(),
            String(q.marks || '').trim().toLowerCase(),
            String(q.difficulty || '').trim().toLowerCase()
        ].join('|');
        const dbQuestions = new Set(existingQuestions.map((q) => getCompositeKey({
            grade: q.grade?.name,
            section: q.section?.name,
            subject: q.subject?.name,
            unit: q.unit?.name,
            topic: q.topic?.name,
            sub_topic: q.sub_topic?.name,
            question: q.question_text,
            options: q.answer_config && typeof q.answer_config === 'object' && Array.isArray(q.answer_config.options)
                ? q.answer_config.options.map((o) => String(o).trim()).join(',') : '',
            answer: q.answer,
            marks: q.marks,
            difficulty: q.difficulty
        })));
        const allGrades = await prisma_1.default.grade.findMany({ where: { organization_id: org_id }, select: { id: true, name: true } });
        const allSections = await prisma_1.default.section.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
        const allSubjects = await prisma_1.default.subject.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
        const allSyllabuses = await prisma_1.default.syllabus.findMany({ where: { organization_id: org_id }, select: { id: true, subject_id: true } });
        const allUnitsRaw = await prisma_1.default.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, subject_id: true, syllabus_id: true } });
        const allTopics = await prisma_1.default.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } });
        const allSubTopics = await prisma_1.default.subTopic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, topic_id: true } });
        const syllabusSubjectMap = new Map(allSyllabuses.map((sy) => [sy.id, sy.subject_id]));
        const unitsWithSubject = allUnitsRaw.map((u) => ({
            id: u.id, name: u.name,
            resolvedSubjectId: u.subject_id ?? (u.syllabus_id ? syllabusSubjectMap.get(u.syllabus_id) ?? null : null)
        }));
        const findGrade = (name) => allGrades.find((g) => g.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findSection = (name, grade_id) => allSections.find((s) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findSubject = (name, grade_id) => allSubjects.find((s) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findUnit = (name, subject_id) => unitsWithSubject.find((u) => u.resolvedSubjectId === subject_id && u.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findTopic = (name, unit_id) => allTopics.find((t) => t.unit_id === unit_id && t.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findSubTopic = (name, topic_id) => allSubTopics.find((st) => st.topic_id === topic_id && st.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const seenQuestions = new Set();
        const resolvedRows = [];
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2;
            const isEmptyRow = Object.values(row).every(val => !val || String(val).trim() === '');
            if (isEmptyRow)
                continue;
            const errors = [];
            let match_status = 'NOT_VALID';
            const startsWithSpecialChar = (val) => val ? /^[^a-zA-Z0-9]/.test(val) : false;
            if (!row.grade || String(row.grade).trim() === '')
                errors.push('Missing required field: "grade"');
            else if (startsWithSpecialChar(row.grade))
                errors.push('Value must not start with a special character');
            if (!row.section || String(row.section).trim() === '')
                errors.push('Missing required field: "section"');
            else if (startsWithSpecialChar(row.section))
                errors.push('Value must not start with a special character');
            if (!row.subject || String(row.subject).trim() === '')
                errors.push('Missing required field: "subject"');
            else if (startsWithSpecialChar(row.subject))
                errors.push('Value must not start with a special character');
            if (!row.unit_lesson || String(row.unit_lesson).trim() === '')
                errors.push('Missing required field: "unit_lesson"');
            else if (startsWithSpecialChar(row.unit_lesson))
                errors.push('Value must not start with a special character');
            if (!row.topic || String(row.topic).trim() === '')
                errors.push('Missing required field: "topic"');
            else if (startsWithSpecialChar(row.topic))
                errors.push('Value must not start with a special character');
            if (row.sub_topic && startsWithSpecialChar(row.sub_topic))
                errors.push('Value must not start with a special character');
            if (!row.question || String(row.question).trim() === '')
                errors.push('Missing required field: "question"');
            if (!row.option1 || String(row.option1).trim() === '')
                errors.push('Missing required field: "options"');
            if (!row.answer || String(row.answer).trim() === '')
                errors.push('Missing required field: "answer"');
            if (!row.marks)
                errors.push('Missing required field: "marks"');
            if (!row.difficulty_level)
                errors.push('Missing required field: "difficulty_level"');
            if (errors.length === 0) {
                const gradeName = String(row.grade).trim();
                const sectionName = String(row.section).trim();
                const subjectName = String(row.subject).trim();
                const unitName = String(row.unit_lesson).trim();
                const topicName = String(row.topic).trim();
                const grade = findGrade(gradeName);
                if (!grade)
                    errors.push(`Hierarchy Error: Grade "${gradeName}" does not exist`);
                else {
                    const section = findSection(sectionName, grade.id);
                    if (!section)
                        errors.push(`Hierarchy Error: Section "${sectionName}" does not exist in Grade "${gradeName}"`);
                    const subject = findSubject(subjectName, grade.id);
                    if (!subject)
                        errors.push(`Hierarchy Error: Subject "${subjectName}" does not exist in Grade "${gradeName}"`);
                    else {
                        const unit = findUnit(unitName, subject.id);
                        if (!unit)
                            errors.push(`Hierarchy Error: Unit "${unitName}" does not exist in Subject "${subjectName}"`);
                        else {
                            const topic = findTopic(topicName, unit.id);
                            if (!topic)
                                errors.push(`Hierarchy Error: Topic "${topicName}" does not exist in Unit "${unitName}"`);
                            else if (row.sub_topic && String(row.sub_topic).trim() !== '') {
                                const subTopic = findSubTopic(String(row.sub_topic).trim(), topic.id);
                                if (!subTopic)
                                    errors.push(`Hierarchy Error: SubTopic "${row.sub_topic}" does not exist in Topic "${topicName}"`);
                            }
                        }
                    }
                }
            }
            if (errors.length === 0) {
                match_status = 'VALID';
                const csvOptions = [row.option1, row.option2, row.option3, row.option4].filter(Boolean).map(o => String(o).trim()).join(',');
                const compositeKey = getCompositeKey({
                    grade: row.grade,
                    section: row.section,
                    subject: row.subject,
                    unit: row.unit_lesson,
                    topic: row.topic,
                    sub_topic: row.sub_topic,
                    question: row.question,
                    options: csvOptions,
                    answer: row.answer,
                    marks: row.marks,
                    difficulty: row.difficulty_level
                });
                const isDuplicate = seenQuestions.has(compositeKey) || dbQuestions.has(compositeKey);
                seenQuestions.add(compositeKey);
                if (isDuplicate)
                    match_status = 'DUPLICATE';
            }
            resolvedRows.push({
                row_number: rowNum,
                raw_data: row,
                match_status,
                resolved_data: { errors }
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
        await prisma_1.default.previewImportData.createMany({ data: previewData });
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
        console.error('[Bulk Preview Error]', error);
        res.status(500).json({ message: 'Failed to process preview', error: error.message });
    }
});
// BULK DISCARD
router.post('/bulk/discard', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'IMPORT'), async (req, res) => {
    try {
        const { session_id } = req.body;
        if (!session_id)
            return res.status(400).json({ message: 'Missing session_id' });
        const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
        const deleteWhere = { session_id, organization_id: req.user.organization_id };
        if (!isGlobalAdmin) {
            deleteWhere.created_by = req.user.user_id;
        }
        const deleteResult = await prisma_1.default.previewImportData.deleteMany({ where: deleteWhere });
        if (deleteResult.count === 0 && !isGlobalAdmin) {
            return res.status(403).json({ message: 'You are not authorized to discard this preview session.' });
        }
        res.json({ message: 'Preview discarded' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to discard preview', error: error.message });
    }
});
// BULK CONFIRM (Takes session_id, reads from preview table, processes them)
router.post('/bulk/confirm', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'IMPORT'), async (req, res) => {
    try {
        const { session_id, modified_records } = req.body;
        if (!session_id)
            return res.status(400).json({ message: 'Missing session_id' });
        const org_id = req.user.organization_id;
        const hasElevatedTenantAccess = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
        let records = [];
        if (modified_records && Array.isArray(modified_records) && modified_records.length > 0) {
            records = modified_records;
        }
        else {
            const previewWhere = { session_id, organization_id: org_id };
            if (!hasElevatedTenantAccess) {
                previewWhere.created_by = req.user.user_id;
            }
            const previews = await prisma_1.default.previewImportData.findMany({ where: previewWhere });
            if (!previews || previews.length === 0)
                return res.status(404).json({ message: 'Session not found or empty' });
            records = previews.map((p) => p.raw_data);
        }
        const activeYearId = await (0, academic_helper_1.getActiveAcademicYearId)(org_id);
        const allGrades = await prisma_1.default.grade.findMany({ where: { organization_id: org_id }, select: { id: true, name: true } });
        const allSections = await prisma_1.default.section.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
        const allSubjects = await prisma_1.default.subject.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
        const allSyllabuses = await prisma_1.default.syllabus.findMany({ where: { organization_id: org_id }, select: { id: true, subject_id: true } });
        const allUnitsRaw = await prisma_1.default.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, subject_id: true, syllabus_id: true } });
        const allTopics = await prisma_1.default.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } });
        const allSubTopics = await prisma_1.default.subTopic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, topic_id: true } });
        const syllabusSubjectMap = new Map(allSyllabuses.map((sy) => [sy.id, sy.subject_id]));
        const unitsWithSubject = allUnitsRaw.map((u) => ({
            id: u.id, name: u.name,
            resolvedSubjectId: u.subject_id ?? (u.syllabus_id ? syllabusSubjectMap.get(u.syllabus_id) ?? null : null)
        }));
        const findGrade = (name) => allGrades.find((g) => g.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findSection = (name, grade_id) => allSections.find((s) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findSubject = (name, grade_id) => allSubjects.find((s) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findUnit = (name, subject_id) => unitsWithSubject.find((u) => u.resolvedSubjectId === subject_id && u.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findTopic = (name, unit_id) => allTopics.find((t) => t.unit_id === unit_id && t.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findSubTopic = (name, topic_id) => allSubTopics.find((st) => st.topic_id === topic_id && st.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const results = { created: 0, skipped: 0, autoCreated: { grades: 0, subjects: 0, units: 0, topics: 0 }, errors: [] };
        const prevGradeCount = allGrades.length;
        const prevSubjectCount = allSubjects.length;
        const prevUnitCount = unitsWithSubject.length;
        const prevTopicCount = allTopics.length;
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2;
            const isEmptyRow = Object.values(row).every(val => !val || String(val).trim() === '');
            if (isEmptyRow)
                continue;
            try {
                const requiredFields = ['grade', 'section', 'subject', 'unit_lesson', 'topic', 'question', 'option1', 'answer', 'marks', 'difficulty_level'];
                for (const f of requiredFields) {
                    if (!row[f] || String(row[f]).trim() === '')
                        throw new Error(`Missing required field: "${f}"`);
                }
                const startsWithSpecialChar = (val) => val ? /^[^a-zA-Z0-9]/.test(val) : false;
                const stringFieldsToCheck = ['grade', 'section', 'subject', 'unit_lesson', 'topic', 'sub_topic'];
                for (const f of stringFieldsToCheck) {
                    const val = String(row[f] || '').trim();
                    if (val && startsWithSpecialChar(val))
                        throw new Error(`Value for "${f}" must not start with a special character`);
                }
                const gradeName = String(row.grade).trim();
                const sectionName = String(row.section).trim();
                const subjectName = String(row.subject).trim();
                const unitName = String(row.unit_lesson).trim();
                const topicName = String(row.topic).trim();
                const grade = findGrade(gradeName);
                if (!grade)
                    throw new Error(`Hierarchy Error: Grade "${gradeName}" does not exist`);
                const section = findSection(sectionName, grade.id);
                if (!section)
                    throw new Error(`Hierarchy Error: Section "${sectionName}" does not exist in Grade "${gradeName}"`);
                const subject = findSubject(subjectName, grade.id);
                if (!subject)
                    throw new Error(`Hierarchy Error: Subject "${subjectName}" does not exist in Grade "${gradeName}"`);
                const unit = findUnit(unitName, subject.id);
                if (!unit)
                    throw new Error(`Hierarchy Error: Unit "${unitName}" does not exist in Subject "${subjectName}"`);
                const topic = findTopic(topicName, unit.id);
                if (!topic)
                    throw new Error(`Hierarchy Error: Topic "${topicName}" does not exist in Unit "${unitName}"`);
                let subTopic = null;
                if (row.sub_topic && String(row.sub_topic).trim() !== '') {
                    subTopic = findSubTopic(String(row.sub_topic).trim(), topic.id);
                    if (!subTopic)
                        throw new Error(`Hierarchy Error: SubTopic "${row.sub_topic}" does not exist in Topic "${topicName}"`);
                }
                let rawType = String(row.question_type || 'MCQ_SINGLE').trim().toUpperCase();
                if (rawType === 'MCQ')
                    rawType = 'MCQ_SINGLE';
                const validTypes = ['MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO', 'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING', 'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK', 'STRUCTURED_5MARK', 'LONG_ANSWER'];
                if (!validTypes.includes(rawType))
                    throw new Error(`Invalid question_type: "${rawType}". Valid: ${validTypes.join(', ')}`);
                const answer_config = buildAnswerConfig(rawType, row);
                try {
                    validateConfig(rawType, answer_config);
                }
                catch {
                    throw new Error(`Invalid answer config for type "${rawType}". Check option1-4 and answer columns.`);
                }
                let diff = String(row.difficulty_level || '').trim().toUpperCase();
                if (diff === 'HARD LEVEL')
                    diff = 'HARD';
                else if (diff === 'EASY LEVEL')
                    diff = 'EASY';
                else if (diff === 'MEDIUM LEVEL')
                    diff = 'MEDIUM';
                if (!['EASY', 'MEDIUM', 'HARD'].includes(diff))
                    diff = 'MEDIUM';
                const marks = parseInt(row.marks, 10);
                if (isNaN(marks) || marks < 1)
                    throw new Error(`Invalid marks: "${row.marks}". Must be a positive integer.`);
                if (!hasElevatedTenantAccess && subject) {
                    const canAccess = await hasSubjectAccess(req.user.user_id, subject.id, org_id);
                    if (!canAccess)
                        throw new Error(`Not authorized to upload questions for subject "${subjectName}"`);
                }
                await prisma_1.default.question.create({
                    data: {
                        grade_id: grade?.id || undefined,
                        section_id: section?.id || undefined,
                        subject_id: subject?.id || undefined,
                        unit_id: unit?.id || undefined,
                        topic_id: topic?.id || undefined,
                        sub_topic_id: subTopic?.id || undefined,
                        question_text: String(row.question).trim(),
                        type: rawType,
                        answer: row.answer ? String(row.answer).trim() : undefined,
                        answer_config,
                        marks,
                        difficulty: diff,
                        is_important: String(row.important_question || 'false').toLowerCase() === 'true',
                        is_repeated: String(row.repeated_question || 'false').toLowerCase() === 'true',
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
        results.autoCreated.grades = allGrades.length - prevGradeCount;
        results.autoCreated.subjects = allSubjects.length - prevSubjectCount;
        results.autoCreated.units = unitsWithSubject.length - prevUnitCount;
        results.autoCreated.topics = allTopics.length - prevTopicCount;
        // Delete the preview records now that they are processed
        const deleteWhere = { session_id, organization_id: org_id };
        if (!hasElevatedTenantAccess)
            deleteWhere.created_by = req.user.user_id;
        await prisma_1.default.previewImportData.deleteMany({ where: deleteWhere });
        await (0, audit_service_1.logAuditEvent)({
            organization_id: org_id,
            user_id: req.user.user_id,
            user_name: req.user.name,
            action_type: 'IMPORT',
            entity_type: 'QUESTION',
            entity_id: session_id,
            metadata: { success_count: results.created, skipped_count: results.skipped }
        });
        const autoMsg = Object.entries(results.autoCreated)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${v} ${k}`)
            .join(', ');
        res.status(201).json({
            message: `Bulk import confirmed. ${results.created} questions created, ${results.skipped} skipped.${autoMsg ? ` Auto-created: ${autoMsg}.` : ''}`,
            results
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to confirm bulk import', error: error.message });
    }
});
// BULK UPLOAD (CSV Parse) — auto-creates missing academic hierarchy
router.post('/bulk', (0, auth_middleware_1.requirePermission)('QUESTION_BANK', 'IMPORT'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ message: 'No file uploaded' });
        const records = (0, sync_1.parse)(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
        if (!records || records.length === 0)
            return res.status(400).json({ message: 'Empty or invalid CSV spreadsheet' });
        const org_id = req.user.organization_id;
        const hasElevatedTenantAccess = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
        const activeYearId = await (0, academic_helper_1.getActiveAcademicYearId)(org_id);
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
        const findGrade = (name) => allGrades.find((g) => g.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findSubject = (name, grade_id) => allSubjects.find((s) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findUnit = (name, subject_id) => unitsWithSubject.find((u) => u.resolvedSubjectId === subject_id && u.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        const findTopic = (name, unit_id) => allTopics.find((t) => t.unit_id === unit_id && t.name.trim().toLowerCase() === String(name).trim().toLowerCase());
        // ── Process rows ──────────────────────────────────────────────────────────
        const results = { created: 0, skipped: 0, autoCreated: { grades: 0, subjects: 0, units: 0, topics: 0 }, errors: [] };
        const prevGradeCount = allGrades.length;
        const prevSubjectCount = allSubjects.length;
        const prevUnitCount = unitsWithSubject.length;
        const prevTopicCount = allTopics.length;
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2; // row 1 = header
            const isEmptyRow = Object.values(row).every(val => !val || String(val).trim() === '');
            if (isEmptyRow)
                continue;
            try {
                // ── Required field checks ────────────────────────────────────────────
                const requiredFields = ['grade', 'subject', 'unit_lesson', 'topic', 'question', 'marks', 'difficulty_level'];
                for (const f of requiredFields) {
                    if (!row[f] || String(row[f]).trim() === '')
                        throw new Error(`Missing required field: "${f}"`);
                }
                const gradeName = String(row.grade).trim();
                const subjectName = String(row.subject).trim();
                const unitName = String(row.unit_lesson).trim();
                const topicName = String(row.topic).trim();
                // ── Auto-resolve or auto-create academic hierarchy ───────────────────
                const grade = findGrade(gradeName);
                if (!grade)
                    throw new Error(`Hierarchy Error: Grade "${gradeName}" does not exist`);
                const subject = findSubject(subjectName, grade.id);
                if (!subject)
                    throw new Error(`Hierarchy Error: Subject "${subjectName}" does not exist in Grade "${gradeName}"`);
                const unit = findUnit(unitName, subject.id);
                if (!unit)
                    throw new Error(`Hierarchy Error: Unit "${unitName}" does not exist in Subject "${subjectName}"`);
                const topic = findTopic(topicName, unit.id);
                if (!topic)
                    throw new Error(`Hierarchy Error: Topic "${topicName}" does not exist in Unit "${unitName}"`);
                // ── Type & Config ────────────────────────────────────────────────────
                let rawType = String(row.question_type || 'MCQ_SINGLE').trim().toUpperCase();
                if (rawType === 'MCQ')
                    rawType = 'MCQ_SINGLE';
                const validTypes = ['MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO', 'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING', 'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK', 'STRUCTURED_5MARK', 'LONG_ANSWER'];
                if (!validTypes.includes(rawType))
                    throw new Error(`Invalid question_type: "${rawType}". Valid: ${validTypes.join(', ')}`);
                const answer_config = buildAnswerConfig(rawType, row);
                try {
                    validateConfig(rawType, answer_config);
                }
                catch {
                    throw new Error(`Invalid answer config for type "${rawType}". Check option1-4 and answer columns.`);
                }
                // ── Difficulty & Marks ───────────────────────────────────────────────
                let diff = String(row.difficulty_level || '').trim().toUpperCase();
                if (diff === 'HARD LEVEL')
                    diff = 'HARD';
                else if (diff === 'EASY LEVEL')
                    diff = 'EASY';
                else if (diff === 'MEDIUM LEVEL')
                    diff = 'MEDIUM';
                if (!['EASY', 'MEDIUM', 'HARD'].includes(diff))
                    diff = 'MEDIUM';
                const marks = parseInt(row.marks, 10);
                if (isNaN(marks) || marks < 1)
                    throw new Error(`Invalid marks: "${row.marks}". Must be a positive integer.`);
                // ── Teacher access check ─────────────────────────────────────────────
                if (!hasElevatedTenantAccess && subject) {
                    const canAccess = await hasSubjectAccess(req.user.user_id, subject.id, org_id);
                    if (!canAccess)
                        throw new Error(`Not authorized to upload questions for subject "${subjectName}"`);
                }
                await prisma_1.default.question.create({
                    data: {
                        grade_id: grade?.id || undefined,
                        subject_id: subject?.id || undefined,
                        unit_id: unit?.id || undefined,
                        topic_id: topic?.id || undefined,
                        question_text: String(row.question).trim(),
                        type: rawType,
                        answer: row.answer ? String(row.answer).trim() : undefined,
                        answer_config,
                        marks,
                        difficulty: diff,
                        is_important: String(row.important_question || 'false').toLowerCase() === 'true',
                        is_repeated: String(row.repeated_question || 'false').toLowerCase() === 'true',
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
