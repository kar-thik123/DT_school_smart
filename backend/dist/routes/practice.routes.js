"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Fetch random practice questions for a topic
// GET AVAILABLE TOPICS (For Student Hierarchy Selector)
router.get('/available-topics', (0, auth_middleware_1.requirePermission)('PRACTICE', 'ATTEMPT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const student_id = req.user.user_id;
        // 1. Fetch student's groups
        const mappings = await prisma_1.default.studentGroupMapping.findMany({
            where: { student_id, organization_id: org_id }
        });
        if (mappings.length === 0) {
            return res.status(403).json({ message: 'Student is not mapped to any Subject Groups' });
        }
        const groupIds = mappings.map((m) => m.group_id);
        const activations = await prisma_1.default.topicActivation.findMany({
            where: {
                subject_group_id: { in: groupIds },
                organization_id: org_id,
                is_active: true
            },
            include: {
                topic: {
                    include: {
                        unit: {
                            include: {
                                subject: true
                            }
                        }
                    }
                }
            }
        });
        // Map into a flatter structure for frontend logic
        const mapped = activations.map((act) => ({
            activation_id: act.id,
            topic_id: act.topic.id,
            topic_name: act.topic.name,
            unit_id: act.topic.unit?.id,
            unit_name: act.topic.unit?.name,
            subject_id: act.topic.unit?.subject?.id,
            subject_name: act.topic.unit?.subject?.name
        }));
        res.json(mapped);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching available topics' });
    }
});
router.get('/topics/:topic_id/questions', (0, auth_middleware_1.requirePermission)('PRACTICE', 'ATTEMPT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const student_id = req.user.user_id;
        // 1. Verify mappings
        const mappings = await prisma_1.default.studentGroupMapping.findMany({
            where: { student_id, organization_id: org_id }
        });
        if (mappings.length === 0)
            return res.status(403).json({ message: 'Student is not mapped to any Subject Groups' });
        const groupIds = mappings.map((m) => m.group_id);
        let searchTopicId = req.params.topic_id;
        if (searchTopicId === 'default_topic') {
            const firstActive = await prisma_1.default.topicActivation.findFirst({
                where: { subject_group_id: { in: groupIds }, organization_id: org_id, is_active: true }
            });
            if (!firstActive)
                return res.status(404).json({ message: 'No active topics available for practice' });
            searchTopicId = firstActive.topic_id;
        }
        // 2. Validate Topic is active for one of student's groups
        const topicActivation = await prisma_1.default.topicActivation.findFirst({
            where: {
                topic_id: searchTopicId,
                subject_group_id: { in: groupIds },
                organization_id: org_id,
                is_active: true
            }
        });
        if (!topicActivation) {
            return res.status(403).json({ message: 'This topic is not active for practice in your Subject Groups' });
        }
        // 3. Fetch all questions for topic
        const questions = await prisma_1.default.question.findMany({
            where: { topic_id: searchTopicId, organization_id: org_id }
        });
        if (questions.length === 0) {
            return res.status(404).json({ message: 'No questions available for this topic' });
        }
        // 4. Randomize and pick up to 10
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selectedOptions = shuffled.slice(0, 10);
        res.json({ questions: selectedOptions });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching practice questions' });
    }
});
const submitAnswersSchema = zod_1.z.object({
    subject_id: zod_1.z.string().uuid(),
    answers: zod_1.z.array(zod_1.z.object({
        question_id: zod_1.z.string().uuid(),
        selected_answer: zod_1.z.string()
    }))
});
// Submit answers and capture data
router.post('/topics/:topic_id/submit', (0, auth_middleware_1.requirePermission)('PRACTICE', 'ATTEMPT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const student_id = req.user.user_id;
        const parsed = submitAnswersSchema.parse(req.body);
        const mappings = await prisma_1.default.studentGroupMapping.findMany({
            where: { student_id, organization_id: org_id }
        });
        if (mappings.length === 0)
            return res.status(403).json({ message: 'Student is not mapped to any Subject Groups' });
        // Evaluate
        let correctCount = 0;
        const questionIds = parsed.answers.map(a => a.question_id);
        const dbQuestions = await prisma_1.default.question.findMany({
            where: { id: { in: questionIds }, organization_id: org_id }
        });
        const evaluatedAnswers = [];
        for (const ans of parsed.answers) {
            const q = dbQuestions.find((dbq) => dbq.id === ans.question_id);
            if (!q)
                continue;
            const config = q.answer_config ?? {};
            const selected = String(ans.selected_answer ?? '').trim().toLowerCase();
            // Resolve the correct answer text to compare against student's selected text
            let correctText = null;
            if (q.answer) {
                // Plain text answer (FILL_BLANK, etc.)
                correctText = String(q.answer).trim().toLowerCase();
            }
            else if (Array.isArray(config.options) && typeof config.correct_answer === 'number') {
                // MCQ_SINGLE: correct_answer is a numeric index (0=A, 1=B, 2=C, 3=D)
                const opt = config.options[config.correct_answer];
                correctText = opt ? String(opt).trim().toLowerCase() : null;
            }
            else if (Array.isArray(config.options) && typeof config.correct_answer === 'string') {
                // MCQ stored as letter (legacy)
                const idx = ['a', 'b', 'c', 'd'].indexOf(config.correct_answer.trim().toLowerCase());
                const opt = idx >= 0 ? config.options[idx] : null;
                correctText = opt ? String(opt).trim().toLowerCase() : null;
            }
            else if (config.correct_answer !== undefined) {
                // TRUE_FALSE / YES_NO
                correctText = String(config.correct_answer).trim().toLowerCase();
            }
            const isCorrect = correctText !== null && correctText === selected;
            if (isCorrect)
                correctCount++;
            evaluatedAnswers.push({
                question_id: q.id,
                selected_answer: String(ans.selected_answer ?? ''),
                is_correct: isCorrect
            });
        }
        // Store Attempt
        const attempt = await prisma_1.default.practiceAttempt.create({
            data: {
                organization_id: org_id,
                student_id: student_id,
                subject_id: parsed.subject_id,
                topic_id: req.params.topic_id,
                total_questions: evaluatedAnswers.length,
                correct_answers: correctCount,
                answers: {
                    create: evaluatedAnswers
                }
            }
        });
        res.status(201).json({ message: 'Practice submitted', score: correctCount, total: evaluatedAnswers.length, attempt_id: attempt.id });
    }
    catch (error) {
        console.error('[practice/submit] ERROR:', error?.message, error?.code, JSON.stringify(error?.meta));
        if (error?.errors)
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        res.status(500).json({ message: 'Server error submitting attempt', detail: error?.message });
    }
});
// READ HISTORY
router.get('/history', (0, auth_middleware_1.requirePermission)('PRACTICE', 'READ'), async (req, res) => {
    try {
        const attempts = await prisma_1.default.practiceAttempt.findMany({
            where: { student_id: req.user.user_id, organization_id: req.user.organization_id },
            include: {
                topic: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(attempts);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
const toggleActivationSchema = zod_1.z.object({
    topic_id: zod_1.z.string().uuid(),
    subject_group_id: zod_1.z.string().uuid(),
    is_active: zod_1.z.boolean()
});
// CREATE/TOGGLE TOPIC ACTIVATION
router.post('/activations/toggle', (0, auth_middleware_1.requirePermission)('PRACTICE', 'MANAGE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const teacher_id = req.user.user_id;
        const teacher_role = req.user.role;
        const parsed = toggleActivationSchema.parse(req.body);
        // Teacher RBAC: verify the teacher is allowed to activate topics for this group
        const isAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(teacher_role);
        if (!isAdmin) {
            // Resolve subjects in this group
            const groupSubjects = await prisma_1.default.subjectGroupSubject.findMany({
                where: { group_id: parsed.subject_group_id },
                select: { subject_id: true }
            });
            const groupSubjectIds = groupSubjects.map((gs) => gs.subject_id);
            // Resolve the section of this group
            const targetGroup = await prisma_1.default.subjectGroup.findUnique({
                where: { id: parsed.subject_group_id },
                select: { section_id: true }
            });
            // Check teacher has SUBJECT_TEACHER for one of these subjects OR is CLASS_INCHARGE for this section
            const validAssignment = await prisma_1.default.teacherAssignment.findFirst({
                where: {
                    teacher_id,
                    organization_id: org_id,
                    OR: [
                        { assignment_type: 'SUBJECT_TEACHER', subject_id: { in: groupSubjectIds } },
                        { assignment_type: 'CLASS_INCHARGE', section_id: targetGroup?.section_id ?? '' }
                    ]
                }
            });
            if (!validAssignment) {
                return res.status(403).json({ message: 'You are not assigned to any subjects in this group' });
            }
        }
        const existing = await prisma_1.default.topicActivation.findFirst({
            where: {
                topic_id: parsed.topic_id,
                subject_group_id: parsed.subject_group_id,
                organization_id: org_id
            }
        });
        if (existing) {
            const updated = await prisma_1.default.topicActivation.update({
                where: { id: existing.id },
                data: { is_active: parsed.is_active }
            });
            return res.json({ message: 'Activation toggled', activation: updated });
        }
        else {
            const created = await prisma_1.default.topicActivation.create({
                data: {
                    topic_id: parsed.topic_id,
                    subject_group_id: parsed.subject_group_id,
                    organization_id: org_id,
                    is_active: parsed.is_active
                }
            });
            return res.status(201).json({ message: 'Topic activated', activation: created });
        }
    }
    catch (error) {
        if (error?.errors)
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        res.status(500).json({ message: 'Server error toggling activation' });
    }
});
// GET ACTIVATIONS BY SUBJECT GROUP
router.get('/activations/:group_id', (0, auth_middleware_1.requirePermission)('PRACTICE', 'MANAGE'), async (req, res) => {
    try {
        const activations = await prisma_1.default.topicActivation.findMany({
            where: { subject_group_id: req.params.group_id, organization_id: req.user.organization_id }
        });
        res.json(activations);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching activations' });
    }
});
exports.default = router;
