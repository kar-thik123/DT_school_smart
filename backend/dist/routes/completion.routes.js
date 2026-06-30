"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const zod_1 = require("zod");
const audit_service_1 = require("../services/audit.service");
const events_service_1 = require("../services/events.service");
const authorization_service_1 = require("../services/authorization.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
/**
 * Checks whether the Completion Management module is enabled for a given organization.
 * Returns true (enabled) if no config record exists (default-on behavior).
 */
async function isCompletionModuleEnabled(org_id) {
    const config = await prisma_1.default.moduleConfig.findUnique({
        where: {
            organization_id_module_name: { organization_id: org_id, module_name: 'completion' }
        }
    });
    if (!config || !config.config_data)
        return true; // default: on
    const data = config.config_data;
    return data['enable_module'] !== false;
}
// Helper to get active assignments for teacher
async function getTeacherAssignments(teacher_id, org_id, academic_year_id) {
    return await prisma_1.default.teacherAssignment.findMany({
        where: {
            teacher_id,
            organization_id: org_id,
            academic_year_id
        },
        include: {
            grade: true,
            section: true,
            subject: true
        }
    });
}
// GET assigned hierarchy for a teacher
router.get('/hierarchy', (0, auth_middleware_1.requirePermission)('COMPLETION_TRACKING', 'VIEW'), async (req, res) => {
    try {
        const academic_year_id = req.academic_year_id;
        const org_id = req.user.organization_id;
        const teacher_id = req.user.user_id;
        // Enforce module-level enable_module flag
        const moduleEnabled = await isCompletionModuleEnabled(org_id);
        if (!moduleEnabled) {
            return res.status(503).json({ message: 'Completion Management module is currently disabled for this organization.' });
        }
        // Check if user is admin (sees all)
        const isAdmin = authorization_service_1.AuthorizationService.hasIdentity(req.user.permissions || [], 'IS_SUPER_ADMIN') ||
            (req.user.permissions || []).includes('COMPLETION_TRACKING:MANAGE');
        if (isAdmin) {
            // Return full organization hierarchy for this academic year
            const grades = await prisma_1.default.grade.findMany({
                where: { organization_id: org_id, academic_year_id: String(academic_year_id) },
                include: {
                    sections: true,
                    subjects: true
                }
            });
            return res.json({ assignments: [], is_admin: true, hierarchy: grades });
        }
        else {
            const assignments = await getTeacherAssignments(teacher_id, org_id, String(academic_year_id));
            // We will let frontend parse these assignments to build the dropdown options
            // This strictly follows the "Teacher only sees assigned academic contexts" requirement
            return res.json({ assignments, is_admin: false });
        }
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// GET topics and subtopics with completion status
router.get('/topics', (0, auth_middleware_1.requirePermission)('COMPLETION_TRACKING', 'VIEW'), async (req, res) => {
    try {
        const { grade_id, section_id, subject_id } = req.query;
        const academic_year_id = req.academic_year_id;
        if (!grade_id || !subject_id) {
            return res.status(400).json({ message: 'Missing required context (grade_id, subject_id)' });
        }
        const org_id = req.user.organization_id;
        // Enforce module-level enable_module flag
        const moduleEnabled = await isCompletionModuleEnabled(org_id);
        if (!moduleEnabled) {
            return res.status(503).json({ message: 'Completion Management module is currently disabled for this organization.' });
        }
        const isGlobalAdmin = authorization_service_1.AuthorizationService.hasIdentity(req.user.permissions || [], 'IS_SUPER_ADMIN') ||
            (req.user.permissions || []).includes('COMPLETION_TRACKING:MANAGE');
        if (!isGlobalAdmin) {
            const subjectCondition = { subject_id: String(subject_id) };
            if (section_id)
                subjectCondition.section_id = String(section_id);
            const classTeacherCondition = { grade_id: String(grade_id), assignment_type: 'CLASS_TEACHER' };
            if (section_id)
                classTeacherCondition.section_id = String(section_id);
            const validAssignment = await prisma_1.default.teacherAssignment.findFirst({
                where: {
                    teacher_id: req.user.user_id,
                    organization_id: org_id,
                    academic_year_id: String(academic_year_id),
                    OR: [
                        subjectCondition,
                        classTeacherCondition
                    ]
                }
            });
            if (!validAssignment) {
                return res.status(403).json({ message: 'Unauthorized access to this academic context.' });
            }
        }
        // 1. Fetch the Units, Topics, Subtopics for the subject
        const units = await prisma_1.default.unit.findMany({
            where: {
                organization_id: org_id,
                subject_id: String(subject_id)
            },
            include: {
                topics: {
                    include: {
                        sub_topics: true
                    }
                }
            },
            orderBy: { order_index: 'asc' }
        });
        // 2. Fetch CompletionTracking for this exact context
        const trackings = await prisma_1.default.completionTracking.findMany({
            where: {
                organization_id: org_id,
                academic_year_id: String(academic_year_id),
                grade_id: String(grade_id),
                section_id: section_id ? String(section_id) : null,
                subject_id: String(subject_id)
            }
        });
        return res.json({ units, trackings });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
const toggleSchema = zod_1.z.object({
    grade_id: zod_1.z.string().uuid(),
    section_id: zod_1.z.string().uuid().nullable(),
    subject_id: zod_1.z.string().uuid(),
    level: zod_1.z.enum(['UNIT', 'TOPIC', 'SUBTOPIC']),
    id: zod_1.z.string().uuid(), // The ID of the unit, topic, or subtopic
    is_completed: zod_1.z.boolean(),
    send_notification: zod_1.z.boolean().default(false),
    // To handle cascade toggle, frontend passes all child IDs that should be toggled
    cascade_topic_ids: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    cascade_subtopic_ids: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
// POST toggle completion
router.post('/toggle', (0, auth_middleware_1.requirePermission)('COMPLETION_TRACKING', 'MANAGE'), async (req, res) => {
    try {
        const parsed = toggleSchema.parse(req.body);
        // Enforce academic year from context header
        const academic_year_id = req.academic_year_id;
        const org_id = req.user.organization_id;
        const teacher_id = req.user.user_id;
        // Enforce module-level enable_module flag
        const moduleEnabled = await isCompletionModuleEnabled(org_id);
        if (!moduleEnabled) {
            return res.status(503).json({ message: 'Completion Management module is currently disabled for this organization.' });
        }
        // Admin check vs Teacher assignment check
        const isAdmin = authorization_service_1.AuthorizationService.hasIdentity(req.user.permissions || [], 'IS_SUPER_ADMIN') ||
            (req.user.permissions || []).includes('COMPLETION_TRACKING:MANAGE');
        if (!isAdmin) {
            const validAssignment = await prisma_1.default.teacherAssignment.findFirst({
                where: {
                    teacher_id,
                    organization_id: org_id,
                    academic_year_id: academic_year_id,
                    OR: [
                        { assignment_type: 'SUBJECT_TEACHER', subject_id: parsed.subject_id },
                        { assignment_type: 'CLASS_TEACHER', section_id: parsed.section_id ?? undefined }
                    ]
                }
            });
            if (!validAssignment) {
                return res.status(403).json({ message: 'Not authorized for this context.' });
            }
        }
        // Process toggles using concurrent reads + sequential writes for high performance
        const buildWhere = (lvl, target_id) => {
            const base = {
                organization_id: org_id,
                academic_year_id: academic_year_id,
                grade_id: parsed.grade_id,
                section_id: parsed.section_id,
                subject_id: parsed.subject_id,
                completion_level: lvl
            };
            if (lvl === 'UNIT')
                return { ...base, unit_id: target_id };
            if (lvl === 'TOPIC')
                return { ...base, topic_id: target_id };
            return { ...base, sub_topic_id: target_id };
        };
        const buildCreate = (lvl, target_id) => {
            const base = {
                organization_id: org_id,
                academic_year_id: academic_year_id,
                grade_id: parsed.grade_id,
                section_id: parsed.section_id,
                subject_id: parsed.subject_id,
                completion_level: lvl,
                is_completed: parsed.is_completed,
                completed_by: teacher_id,
                completed_at: parsed.is_completed ? new Date() : null,
                notification_sent: parsed.send_notification,
                notification_sent_at: (parsed.is_completed && parsed.send_notification) ? new Date() : null,
            };
            if (lvl === 'UNIT')
                return { ...base, unit_id: target_id };
            if (lvl === 'TOPIC')
                return { ...base, topic_id: target_id };
            return { ...base, sub_topic_id: target_id };
        };
        const buildUpdate = () => {
            return {
                is_completed: parsed.is_completed,
                completed_by: teacher_id, // keep last updated by
                // if toggled on, update completed_at. if toggled off, DO NOT nullify it so audit history is preserved!
                ...(parsed.is_completed ? { completed_at: new Date() } : {}),
                notification_sent: parsed.send_notification,
                ...(parsed.is_completed && parsed.send_notification ? { notification_sent_at: new Date() } : {})
            };
        };
        // 1. Fetch existing tracking records CONCURRENTLY outside the transaction for maximum speed
        const [existingUnit, existingTopics, existingSubtopics] = await Promise.all([
            prisma_1.default.completionTracking.findFirst({
                where: buildWhere(parsed.level, parsed.id)
            }),
            (parsed.cascade_topic_ids && parsed.cascade_topic_ids.length > 0)
                ? prisma_1.default.completionTracking.findMany({
                    where: {
                        organization_id: org_id, academic_year_id: academic_year_id,
                        grade_id: parsed.grade_id, section_id: parsed.section_id, subject_id: parsed.subject_id,
                        completion_level: 'TOPIC', topic_id: { in: parsed.cascade_topic_ids }
                    }
                })
                : Promise.resolve([]),
            (parsed.cascade_subtopic_ids && parsed.cascade_subtopic_ids.length > 0)
                ? prisma_1.default.completionTracking.findMany({
                    where: {
                        organization_id: org_id, academic_year_id: academic_year_id,
                        grade_id: parsed.grade_id, section_id: parsed.section_id, subject_id: parsed.subject_id,
                        completion_level: 'SUBTOPIC', sub_topic_id: { in: parsed.cascade_subtopic_ids }
                    }
                })
                : Promise.resolve([])
        ]);
        // 2. Build our database queries into an array
        const txOperations = [];
        // Target (Unit/Topic/Subtopic) upsert
        if (existingUnit) {
            txOperations.push(prisma_1.default.completionTracking.update({
                where: { id: existingUnit.id },
                data: buildUpdate()
            }));
        }
        else {
            txOperations.push(prisma_1.default.completionTracking.create({
                data: buildCreate(parsed.level, parsed.id)
            }));
        }
        // Cascade Topics
        if (parsed.cascade_topic_ids && parsed.cascade_topic_ids.length > 0) {
            const existingTopicIds = existingTopics.map((t) => t.topic_id);
            const newTopicIds = parsed.cascade_topic_ids.filter((id) => !existingTopicIds.includes(id));
            if (existingTopicIds.length > 0) {
                txOperations.push(prisma_1.default.completionTracking.updateMany({
                    where: {
                        organization_id: org_id, academic_year_id: academic_year_id,
                        grade_id: parsed.grade_id, section_id: parsed.section_id, subject_id: parsed.subject_id,
                        completion_level: 'TOPIC', topic_id: { in: existingTopicIds }
                    },
                    data: buildUpdate()
                }));
            }
            if (newTopicIds.length > 0) {
                txOperations.push(prisma_1.default.completionTracking.createMany({
                    data: newTopicIds.map((id) => buildCreate('TOPIC', id))
                }));
            }
        }
        // Cascade Subtopics
        if (parsed.cascade_subtopic_ids && parsed.cascade_subtopic_ids.length > 0) {
            const existingSubtopicIds = existingSubtopics.map((t) => t.sub_topic_id);
            const newSubtopicIds = parsed.cascade_subtopic_ids.filter((id) => !existingSubtopicIds.includes(id));
            if (existingSubtopicIds.length > 0) {
                txOperations.push(prisma_1.default.completionTracking.updateMany({
                    where: {
                        organization_id: org_id, academic_year_id: academic_year_id,
                        grade_id: parsed.grade_id, section_id: parsed.section_id, subject_id: parsed.subject_id,
                        completion_level: 'SUBTOPIC', sub_topic_id: { in: existingSubtopicIds }
                    },
                    data: buildUpdate()
                }));
            }
            if (newSubtopicIds.length > 0) {
                txOperations.push(prisma_1.default.completionTracking.createMany({
                    data: newSubtopicIds.map((id) => buildCreate('SUBTOPIC', id))
                }));
            }
        }
        // 3. Execute all database writes instantly in a single sequential transaction!
        await prisma_1.default.$transaction(txOperations);
        // 4. Send Notifications via Event Bus
        if (parsed.is_completed && parsed.send_notification) {
            let eventType;
            let typeStr;
            if (parsed.level === 'UNIT') {
                eventType = events_service_1.EventTypes.COMPLETION_UNIT_ENABLED;
                typeStr = 'UNIT';
            }
            else if (parsed.level === 'TOPIC') {
                eventType = events_service_1.EventTypes.COMPLETION_TOPIC_ENABLED;
                typeStr = 'TOPIC';
            }
            else {
                eventType = events_service_1.EventTypes.COMPLETION_SUBTOPIC_ENABLED;
                typeStr = 'SUBTOPIC';
            }
            const payload = {
                organization_id: org_id,
                actor_id: teacher_id,
                entity: {
                    type: typeStr,
                    id: parsed.id,
                    name: 'Academic Content' // Could query DB for actual name if needed
                },
                context: {
                    academic_year_id: academic_year_id,
                    grade_id: parsed.grade_id,
                    section_id: parsed.section_id,
                    subject_id: parsed.subject_id
                }
            };
            (0, events_service_1.emitNotificationEvent)(eventType, payload);
        }
        await (0, audit_service_1.logAuditEvent)({
            organization_id: org_id,
            user_id: teacher_id,
            user_name: req.user.name,
            action_type: 'TOGGLE',
            entity_type: 'COMPLETION',
            entity_id: parsed.id,
            metadata: {
                level: parsed.level,
                is_completed: parsed.is_completed,
                subject_id: parsed.subject_id,
                grade_id: parsed.grade_id,
                section_id: parsed.section_id
            }
        });
        return res.json({ message: 'Completion status updated successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
