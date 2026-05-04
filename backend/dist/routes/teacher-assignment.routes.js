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
const assignmentSchema = zod_1.z.object({
    teacher_id: zod_1.z.string().uuid(),
    academic_year_id: zod_1.z.string().uuid(),
    assignment_type: zod_1.z.enum(['CLASS_TEACHER', 'SUBJECT_TEACHER']),
    grade_id: zod_1.z.string().uuid(),
    section_id: zod_1.z.string().uuid().optional().nullable(),
    subject_id: zod_1.z.string().uuid().optional().nullable()
});
// Read all assignments
router.get('/', (0, auth_middleware_1.requirePermission)('TEACHER_ASSIGNMENT', 'READ'), async (req, res) => {
    try {
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: { organization_id: req.user.organization_id },
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
    academic_year_id: zod_1.z.string().uuid(),
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
                    academic_year_id: parsed.academic_year_id,
                    organization_id: req.user.organization_id
                };
            });
            // Validation
            for (const a of dataToInsert) {
                if (a.assignment_type === 'CLASS_TEACHER' && a.section_id) {
                    const existing = await prisma_1.default.teacherAssignment.findFirst({
                        where: { organization_id: a.organization_id, academic_year_id: a.academic_year_id, section_id: a.section_id, assignment_type: 'CLASS_TEACHER' }
                    });
                    if (existing)
                        throw new Error(`Section already has a Class Teacher assigned for this academic year`);
                }
                if (a.assignment_type === 'SUBJECT_TEACHER' && a.section_id && a.subject_id) {
                    const existing = await prisma_1.default.teacherAssignment.findFirst({
                        where: { organization_id: a.organization_id, academic_year_id: a.academic_year_id, section_id: a.section_id, subject_id: a.subject_id, assignment_type: 'SUBJECT_TEACHER' }
                    });
                    if (existing)
                        throw new Error(`This subject is already assigned to a teacher in this section for this academic year`);
                }
            }
            const assignmentProcess = await prisma_1.default.teacherAssignment.createMany({
                data: dataToInsert,
                skipDuplicates: true
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
                    where: { organization_id: req.user.organization_id, academic_year_id: parsed.academic_year_id, section_id: parsed.section_id, assignment_type: 'CLASS_TEACHER' }
                });
                if (existing)
                    return res.status(400).json({ message: `Section already has a Class Teacher assigned for this academic year` });
            }
            if (parsed.assignment_type === 'SUBJECT_TEACHER' && parsed.section_id && parsed.subject_id) {
                const existing = await prisma_1.default.teacherAssignment.findFirst({
                    where: { organization_id: req.user.organization_id, academic_year_id: parsed.academic_year_id, section_id: parsed.section_id, subject_id: parsed.subject_id, assignment_type: 'SUBJECT_TEACHER' }
                });
                if (existing)
                    return res.status(400).json({ message: `This subject is already assigned to a teacher in this section for this academic year` });
            }
            const assignment = await prisma_1.default.teacherAssignment.create({
                data: {
                    ...parsed,
                    organization_id: req.user.organization_id
                }
            });
            return res.status(201).json({ message: 'Teacher assignment created', assignment });
        }
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Duplicate assignment detected for this teacher in the specified scope' });
        }
        if (error?.errors) {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
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
            const conflict = await prisma_1.default.teacherAssignment.findFirst({
                where: { organization_id: req.user.organization_id, academic_year_id: parsed.academic_year_id, section_id: parsed.section_id, assignment_type: 'CLASS_TEACHER', id: { not: existing.id } }
            });
            if (conflict)
                return res.status(400).json({ message: `Section already has a Class Teacher assigned for this academic year` });
        }
        if (parsed.assignment_type === 'SUBJECT_TEACHER' && parsed.section_id && parsed.subject_id) {
            const conflict = await prisma_1.default.teacherAssignment.findFirst({
                where: { organization_id: req.user.organization_id, academic_year_id: parsed.academic_year_id, section_id: parsed.section_id, subject_id: parsed.subject_id, assignment_type: 'SUBJECT_TEACHER', id: { not: existing.id } }
            });
            if (conflict)
                return res.status(400).json({ message: `This subject is already assigned to a teacher in this section for this academic year` });
        }
        const assignment = await prisma_1.default.teacherAssignment.update({
            where: { id: existing.id },
            data: parsed
        });
        res.json({ message: 'Teacher assignment updated', assignment });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Duplicate assignment detected' });
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
        res.json({ message: 'Teacher assignment deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting assignment' });
    }
});
exports.default = router;
