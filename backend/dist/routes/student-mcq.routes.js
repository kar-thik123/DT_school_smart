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
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
async function isMcqModuleEnabled(org_id) {
    const config = await prisma_1.default.moduleConfig.findUnique({
        where: {
            organization_id_module_name: { organization_id: org_id, module_name: 'mcq' }
        }
    });
    if (!config || !config.config_data)
        return true; // default: on
    const data = config.config_data;
    return data['enable_module'] !== false;
}
const checkMcqEnabled = async (req, res, next) => {
    const enabled = await isMcqModuleEnabled(req.user.organization_id);
    if (!enabled) {
        return res.status(503).json({ message: 'MCQ module is currently disabled for this organization.' });
    }
    next();
};
// GET /student-mcq/curriculum
router.get('/curriculum', (0, auth_middleware_1.requirePermission)('MCQ', 'VIEW'), checkMcqEnabled, async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const student_id = req.user.user_id;
        const academic_year_id = req.academic_year_id;
        if (!academic_year_id) {
            return res.status(400).json({ message: 'No active academic year found' });
        }
        const enrollment = await prisma_1.default.studentEnrollment.findFirst({
            where: {
                student_id,
                academic_year_id,
                organization_id: org_id,
                status: 'ACTIVE'
            },
            include: {
                grade: true,
                section: true
            }
        });
        if (!enrollment || !enrollment.grade_id) {
            return res.status(404).json({ message: 'Student enrollment not found for the current academic year' });
        }
        // Fetch subjects for this grade
        const subjects = await prisma_1.default.subject.findMany({
            where: {
                grade_id: enrollment.grade_id,
                organization_id: org_id
            },
            select: {
                id: true,
                name: true
            }
        });
        const subjectIds = subjects.map((s) => s.id);
        // Fetch units for these subjects
        const units = await prisma_1.default.unit.findMany({
            where: {
                subject_id: { in: subjectIds },
                organization_id: org_id
            },
            select: {
                id: true,
                name: true,
                subject_id: true
            }
        });
        const unitIds = units.map((u) => u.id);
        // Fetch topics for these units
        const topics = await prisma_1.default.topic.findMany({
            where: {
                unit_id: { in: unitIds },
                organization_id: org_id
            },
            select: {
                id: true,
                name: true,
                unit_id: true
            }
        });
        const topicIds = topics.map((t) => t.id);
        // Fetch subtopics for these topics
        const subTopics = await prisma_1.default.subTopic.findMany({
            where: {
                topic_id: { in: topicIds },
                organization_id: org_id
            },
            select: {
                id: true,
                name: true,
                topic_id: true
            }
        });
        res.json({
            grade: enrollment.grade,
            section: enrollment.section,
            subjects,
            units,
            topics,
            subTopics
        });
    }
    catch (error) {
        console.error('Error fetching student curriculum:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// GET /student-mcq/questions
router.get('/questions', (0, auth_middleware_1.requirePermission)('MCQ', 'VIEW'), checkMcqEnabled, async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { sub_topic_id, topic_id, unit_id, subject_id } = req.query;
        const filter = { organization_id: org_id };
        if (sub_topic_id)
            filter.sub_topic_id = String(sub_topic_id);
        else if (topic_id)
            filter.topic_id = String(topic_id);
        else if (unit_id)
            filter.unit_id = String(unit_id);
        else if (subject_id)
            filter.subject_id = String(subject_id);
        else {
            return res.status(400).json({ message: 'Please provide at least a subject_id' });
        }
        // Only fetch MCQ types
        filter.type = { in: ['MCQ_SINGLE', 'MCQ_MULTI'] };
        const questions = await prisma_1.default.question.findMany({
            where: filter,
            select: {
                id: true,
                question_text: true,
                type: true,
                marks: true,
                difficulty: true,
                answer_config: true,
                // we intentionally omit 'answer' so students don't cheat by checking network responses
                // unless they are meant to self-check. We will send the answer if this is for practice.
                // For practice mode, let's include it.
                answer: true
            }
        });
        res.json(questions);
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// GET /student-mcq/attempts/count
router.get('/attempts/count', async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const student_id = req.user.user_id;
        const yearId = req.academic_year_id;
        const { sub_topic_id, topic_id, unit_id, subject_id } = req.query;
        if (!subject_id) {
            return res.status(400).json({ message: 'subject_id is required' });
        }
        const filter = {
            organization_id: org_id,
            academic_year_id: yearId,
            student_id: student_id,
            subject_id: String(subject_id)
        };
        if (sub_topic_id)
            filter.sub_topic_id = String(sub_topic_id);
        else if (topic_id)
            filter.topic_id = String(topic_id);
        else if (unit_id)
            filter.unit_id = String(unit_id);
        const maxAttempt = await prisma_1.default.studentAssessmentAttempt.aggregate({
            where: filter,
            _max: {
                attempt_count: true
            }
        });
        res.json({ attempt_count: maxAttempt._max.attempt_count || 0 });
    }
    catch (error) {
        console.error('Error fetching attempt count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// POST /student-mcq/attempts
router.post('/attempts', (0, auth_middleware_1.requirePermission)('MCQ', 'ATTEMPT'), checkMcqEnabled, async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const student_id = req.user.user_id;
        const yearId = req.academic_year_id;
        const { subject_id, unit_id, topic_id, sub_topic_id, attempt_count, start_time, end_time, total_questions, correct_answers } = req.body;
        if (!subject_id || !start_time || !end_time || total_questions === undefined || correct_answers === undefined) {
            return res.status(400).json({ message: 'Missing required fields for attempt' });
        }
        const newAttempt = await prisma_1.default.studentAssessmentAttempt.create({
            data: {
                organization_id: org_id,
                academic_year_id: yearId,
                student_id: student_id,
                subject_id: subject_id,
                unit_id: unit_id || null,
                topic_id: topic_id || null,
                sub_topic_id: sub_topic_id || null,
                attempt_count: attempt_count || 1,
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                total_questions: total_questions,
                correct_answers: correct_answers
            }
        });
        res.status(201).json({ message: 'Attempt saved successfully', attempt: newAttempt });
    }
    catch (error) {
        console.error('Error saving student attempt:', error);
        res.status(500).json({ message: 'Server error while saving attempt' });
    }
});
const completeTopicSchema = zod_1.z.object({
    subject_id: zod_1.z.string().uuid()
});
router.post('/topics/:topic_id/complete', (0, auth_middleware_1.requirePermission)('MCQ', 'ATTEMPT'), checkMcqEnabled, async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const student_id = req.user.user_id;
        const yearId = req.academic_year_id;
        const topic_id = req.params.topic_id;
        const parsed = completeTopicSchema.parse(req.body);
        const completion = await prisma_1.default.studentTopicCompletion.upsert({
            where: {
                student_id_topic_id_academic_year_id: {
                    student_id,
                    topic_id,
                    academic_year_id: yearId || ''
                }
            },
            update: {},
            create: {
                organization_id: org_id,
                student_id,
                academic_year_id: yearId,
                subject_id: parsed.subject_id,
                topic_id: topic_id
            }
        });
        const topic = await prisma_1.default.topic.findUnique({ where: { id: topic_id } });
        // Enforce EventTrigger
        const payload = {
            organization_id: org_id,
            actor_id: student_id,
            entity: {
                type: 'STUDENT_TOPIC_COMPLETION',
                id: topic_id,
                name: topic?.name || 'Topic'
            },
            context: {
                academic_year_id: yearId,
                grade_id: '',
                subject_id: parsed.subject_id
            }
        };
        const enrollment = await prisma_1.default.studentEnrollment.findFirst({
            where: { student_id, academic_year_id: yearId, status: 'ACTIVE' }
        });
        if (enrollment) {
            payload.context.grade_id = enrollment.grade_id;
            payload.context.section_id = enrollment.section_id;
        }
        // @ts-ignore
        const { emitNotificationEvent, EventTypes } = await Promise.resolve().then(() => __importStar(require('../services/events.service')));
        emitNotificationEvent(EventTypes.STUDENT_TOPIC_COMPLETION, payload);
        res.status(200).json({ message: 'Topic marked as completed', completion });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error marking topic completed', error: error.message });
    }
});
exports.default = router;
