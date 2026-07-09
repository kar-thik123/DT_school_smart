"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const audit_service_1 = require("../services/audit.service");
const academic_context_resolver_1 = require("../utils/academic-context.resolver");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
const assignmentSchema = zod_1.z.object({
    teacher_id: zod_1.z.string().uuid(),
    assignment_type: zod_1.z.enum(['CLASS_TEACHER', 'SUBJECT_TEACHER']),
    grade_id: zod_1.z.string().uuid(),
    section_id: zod_1.z.string().uuid().optional().nullable(),
    subject_id: zod_1.z.string().uuid().optional().nullable()
});
// Get current user's assignments
router.get('/me', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: {
                organization_id: req.user.organization_id,
                academic_year_id: yearId,
                teacher_id: req.user.user_id
            },
            include: {
                grade: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(assignments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching your assignments' });
    }
});
// Read all assignments
router.get('/', (0, auth_middleware_1.requirePermission)('TEACHER_ASSIGNMENT', 'VIEW'), async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: {
                organization_id: req.user.organization_id,
                academic_year_id: yearId
            },
            include: {
                teacher: { select: { id: true, name: true, email: true } },
                grade: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        if (req.query.grouped === 'true') {
            const groupedMap = new Map();
            assignments.forEach((a) => {
                if (!groupedMap.has(a.teacher_id)) {
                    groupedMap.set(a.teacher_id, {
                        teacher_id: a.teacher_id,
                        teacher: a.teacher,
                        assignments: []
                    });
                }
                groupedMap.get(a.teacher_id).assignments.push(a);
            });
            return res.json(Array.from(groupedMap.values()));
        }
        res.json(assignments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching assignments' });
    }
});
const batchAssignmentSchema = zod_1.z.object({
    teacher_id: zod_1.z.string().uuid(),
    assignments: zod_1.z.array(zod_1.z.object({
        assignment_type: zod_1.z.enum(['CLASS_TEACHER', 'SUBJECT_TEACHER']),
        grade_id: zod_1.z.string().uuid(),
        section_id: zod_1.z.string().uuid().optional().nullable(),
        subject_id: zod_1.z.string().uuid().optional().nullable()
    })).min(1)
});
// Create assignment(s)
router.post('/', (0, auth_middleware_1.requirePermission)('TEACHER_ASSIGNMENT', 'CREATE'), async (req, res) => {
    try {
        const isBatch = Array.isArray(req.body.assignments);
        if (isBatch) {
            const parsed = batchAssignmentSchema.parse(req.body);
            const dataToInsert = parsed.assignments.map(a => {
                if (a.assignment_type === 'SUBJECT_TEACHER' && !a.subject_id) {
                    throw new Error('subject_id is required for SUBJECT_TEACHER assignment');
                }
                return {
                    ...a,
                    subject_id: a.assignment_type === 'CLASS_TEACHER' ? null : a.subject_id,
                    teacher_id: parsed.teacher_id,
                    academic_year_id: req.academic_year_id,
                    organization_id: req.user.organization_id
                };
            });
            // Validation
            for (const a of dataToInsert) {
                if (a.assignment_type === 'CLASS_TEACHER' && a.section_id) {
                    const existing = await prisma_1.default.teacherAssignment.findFirst({
                        where: { organization_id: a.organization_id, academic_year_id: a.academic_year_id, section_id: a.section_id, assignment_type: 'CLASS_TEACHER' }
                    });
                    if (existing && existing.teacher_id !== a.teacher_id)
                        throw new Error(`Section already has a Class Teacher assigned for this academic year`);
                }
                if (a.assignment_type === 'SUBJECT_TEACHER' && a.section_id && a.subject_id) {
                    const existing = await prisma_1.default.teacherAssignment.findFirst({
                        where: { organization_id: a.organization_id, academic_year_id: a.academic_year_id, section_id: a.section_id, subject_id: a.subject_id, assignment_type: 'SUBJECT_TEACHER' }
                    });
                    if (existing && existing.teacher_id !== a.teacher_id)
                        throw new Error(`This subject is already assigned to a teacher in this section for this academic year`);
                }
                // Pre-check for duplicate assignment for the exact same teacher
                const duplicateAssignment = await prisma_1.default.teacherAssignment.findFirst({
                    where: {
                        teacher_id: a.teacher_id,
                        assignment_type: a.assignment_type,
                        grade_id: a.grade_id,
                        section_id: a.section_id || null,
                        subject_id: a.subject_id || null,
                        academic_year_id: a.academic_year_id,
                        organization_id: a.organization_id
                    }
                });
                if (duplicateAssignment) {
                    return res.status(409).json({ message: 'Teacher is already assigned to this subject, grade, and section.' });
                }
            }
            const assignmentProcess = await prisma_1.default.teacherAssignment.createMany({
                data: dataToInsert,
                skipDuplicates: true
            });
            await (0, audit_service_1.logAuditEvent)({
                organization_id: req.user.organization_id,
                user_id: req.user.user_id,
                user_name: req.user.name,
                action_type: 'ASSIGN',
                entity_type: 'TEACHER_ASSIGNMENT',
                entity_id: parsed.teacher_id,
                metadata: { batch: true, count: assignmentProcess.count }
            });
            await notification_service_1.NotificationService.sendNotification({
                organization_id: req.user.organization_id,
                event_type: 'TEACHER_ASSIGNMENT',
                entity_type: 'TEACHER_ASSIGNMENT',
                entity_id: parsed.teacher_id,
                title: 'New Class Assignments',
                message: `You have received ${parsed.assignments.length} new class assignment(s).`,
                actor_id: req.user.user_id,
                context_data: { icon: 'user-check', color: 'notification-blue' },
                recipient_ids: [parsed.teacher_id]
            });
            return res.status(201).json({ message: 'Teacher assignments created', count: assignmentProcess.count });
        }
        else {
            const parsed = assignmentSchema.parse(req.body);
            if (parsed.assignment_type === 'SUBJECT_TEACHER' && !parsed.subject_id) {
                return res.status(400).json({ message: 'subject_id is required for SUBJECT_TEACHER assignment' });
            }
            if (parsed.assignment_type === 'CLASS_TEACHER') {
                parsed.subject_id = null;
            }
            if (parsed.assignment_type === 'CLASS_TEACHER' && parsed.section_id) {
                const existing = await prisma_1.default.teacherAssignment.findFirst({
                    where: { organization_id: req.user.organization_id, academic_year_id: req.academic_year_id, section_id: parsed.section_id, assignment_type: 'CLASS_TEACHER' }
                });
                if (existing && existing.teacher_id !== parsed.teacher_id)
                    return res.status(400).json({ message: `Section already has a Class Teacher assigned for this academic year` });
            }
            if (parsed.assignment_type === 'SUBJECT_TEACHER' && parsed.section_id && parsed.subject_id) {
                const existing = await prisma_1.default.teacherAssignment.findFirst({
                    where: { organization_id: req.user.organization_id, academic_year_id: req.academic_year_id, section_id: parsed.section_id, subject_id: parsed.subject_id, assignment_type: 'SUBJECT_TEACHER' }
                });
                if (existing && existing.teacher_id !== parsed.teacher_id)
                    return res.status(400).json({ message: `This subject is already assigned to a teacher in this section for this academic year` });
            }
            // Pre-check for duplicate assignment for the exact same teacher
            const duplicateAssignment = await prisma_1.default.teacherAssignment.findFirst({
                where: {
                    teacher_id: parsed.teacher_id,
                    assignment_type: parsed.assignment_type,
                    grade_id: parsed.grade_id,
                    section_id: parsed.section_id || null,
                    subject_id: parsed.subject_id || null,
                    academic_year_id: req.academic_year_id,
                    organization_id: req.user.organization_id
                }
            });
            if (duplicateAssignment) {
                return res.status(409).json({ message: 'Teacher is already assigned to this subject, grade, and section.' });
            }
            const assignment = await prisma_1.default.teacherAssignment.create({
                data: {
                    ...parsed,
                    academic_year_id: req.academic_year_id,
                    organization_id: req.user.organization_id
                }
            });
            await (0, audit_service_1.logAuditEvent)({
                organization_id: req.user.organization_id,
                user_id: req.user.user_id,
                user_name: req.user.name,
                action_type: 'ASSIGN',
                entity_type: 'TEACHER_ASSIGNMENT',
                entity_id: assignment.id,
                metadata: { teacher_id: assignment.teacher_id, assignment_type: assignment.assignment_type }
            });
            await notification_service_1.NotificationService.sendNotification({
                organization_id: req.user.organization_id,
                event_type: 'TEACHER_ASSIGNMENT',
                entity_type: 'TEACHER_ASSIGNMENT',
                entity_id: assignment.id,
                title: 'New Class Assignment',
                message: `You have been assigned as a ${parsed.assignment_type.replace('_', ' ').toLowerCase()}.`,
                actor_id: req.user.user_id,
                context_data: { icon: 'user-check', color: 'notification-blue' },
                recipient_ids: [assignment.teacher_id]
            });
            return res.status(201).json({ message: 'Teacher assignment created', assignment });
        }
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Teacher is already assigned to this subject, grade, and section.' });
        }
        const fs = require('fs');
        fs.appendFileSync('error.log', new Date().toISOString() + ' - Error creating batch assignment: ' + (error.stack || error) + '\n' + (error.errors ? JSON.stringify(error.errors) : '') + '\n');
        if (error?.errors) {
            console.error('Validation Error in batch assignments:', error.errors);
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        console.error('Error creating assignment:', error);
        res.status(400).json({ message: error.message || 'Error creating assignment' });
    }
});
// Edit assignment
router.put('/:id', (0, auth_middleware_1.requirePermission)('TEACHER_ASSIGNMENT', 'EDIT'), async (req, res) => {
    try {
        const existing = await prisma_1.default.teacherAssignment.findFirst({
            where: { id: req.params.id, organization_id: req.user.organization_id }
        });
        if (!existing)
            return res.status(404).json({ message: 'Assignment not found' });
        const parsed = assignmentSchema.parse(req.body);
        // Validation Rules
        if (parsed.assignment_type === 'SUBJECT_TEACHER' && !parsed.subject_id) {
            return res.status(400).json({ message: 'subject_id is required for SUBJECT_TEACHER assignment' });
        }
        if (parsed.assignment_type === 'CLASS_TEACHER') {
            parsed.subject_id = null;
        }
        if (parsed.assignment_type === 'CLASS_TEACHER' && parsed.section_id) {
            const exist = await prisma_1.default.teacherAssignment.findFirst({
                where: { organization_id: req.user.organization_id, academic_year_id: req.academic_year_id, section_id: parsed.section_id, assignment_type: 'CLASS_TEACHER', id: { not: req.params.id } }
            });
            if (exist && exist.teacher_id !== parsed.teacher_id)
                return res.status(400).json({ message: `Section already has a Class Teacher assigned` });
        }
        if (parsed.assignment_type === 'SUBJECT_TEACHER' && parsed.section_id && parsed.subject_id) {
            const exist = await prisma_1.default.teacherAssignment.findFirst({
                where: { organization_id: req.user.organization_id, academic_year_id: req.academic_year_id, section_id: parsed.section_id, subject_id: parsed.subject_id, assignment_type: 'SUBJECT_TEACHER', id: { not: req.params.id } }
            });
            if (exist && exist.teacher_id !== parsed.teacher_id)
                return res.status(400).json({ message: `This subject is already assigned to a teacher in this section` });
        }
        // Pre-check for duplicate assignment for the exact same teacher
        const duplicateAssignment = await prisma_1.default.teacherAssignment.findFirst({
            where: {
                teacher_id: parsed.teacher_id,
                assignment_type: parsed.assignment_type,
                grade_id: parsed.grade_id,
                section_id: parsed.section_id || null,
                subject_id: parsed.subject_id || null,
                academic_year_id: req.academic_year_id,
                organization_id: req.user.organization_id,
                id: { not: req.params.id }
            }
        });
        if (duplicateAssignment) {
            return res.status(409).json({ message: 'Teacher is already assigned to this subject, grade, and section.' });
        }
        const assignment = await prisma_1.default.teacherAssignment.update({
            where: { id: req.params.id },
            data: {
                ...parsed,
                academic_year_id: req.academic_year_id
            }
        });
        await (0, audit_service_1.logAuditEvent)({
            organization_id: req.user.organization_id,
            user_id: req.user.user_id,
            user_name: req.user.name,
            action_type: 'UPDATE',
            entity_type: 'TEACHER_ASSIGNMENT',
            entity_id: assignment.id,
            metadata: { teacher_id: assignment.teacher_id, assignment_type: assignment.assignment_type }
        });
        await notification_service_1.NotificationService.sendNotification({
            organization_id: req.user.organization_id,
            event_type: 'TEACHER_ASSIGNMENT',
            entity_type: 'TEACHER_ASSIGNMENT',
            entity_id: assignment.id,
            title: 'Assignment Updated',
            message: `Your class assignment details have been updated.`,
            actor_id: req.user.user_id,
            context_data: { icon: 'edit', color: 'notification-orange' },
            recipient_ids: [assignment.teacher_id]
        });
        res.json({ message: 'Teacher assignment updated', assignment });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Teacher is already assigned to this subject, grade, and section.' });
        }
        res.status(400).json({ message: 'Error updating assignment', error: error.message });
    }
});
// Delete assignment
router.delete('/:id', (0, auth_middleware_1.requirePermission)('TEACHER_ASSIGNMENT', 'DELETE'), async (req, res) => {
    try {
        const existing = await prisma_1.default.teacherAssignment.findFirst({
            where: { id: req.params.id, organization_id: req.user.organization_id }
        });
        if (!existing)
            return res.status(404).json({ message: 'Assignment not found' });
        await prisma_1.default.teacherAssignment.delete({ where: { id: existing.id } });
        await (0, audit_service_1.logAuditEvent)({
            organization_id: req.user.organization_id,
            user_id: req.user.user_id,
            user_name: req.user.name,
            action_type: 'DELETE',
            entity_type: 'TEACHER_ASSIGNMENT',
            entity_id: existing.id,
            metadata: { teacher_id: existing.teacher_id, assignment_type: existing.assignment_type }
        });
        await notification_service_1.NotificationService.sendNotification({
            organization_id: req.user.organization_id,
            event_type: 'TEACHER_ASSIGNMENT',
            entity_type: 'TEACHER_ASSIGNMENT',
            entity_id: existing.id,
            title: 'Assignment Removed',
            message: `Your class assignment has been removed.`,
            actor_id: req.user.user_id,
            context_data: { icon: 'user-minus', color: 'notification-red' },
            recipient_ids: [existing.teacher_id]
        });
        res.json({ message: 'Teacher assignment deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting assignment' });
    }
});
exports.default = router;
