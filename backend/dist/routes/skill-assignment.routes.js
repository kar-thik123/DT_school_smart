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
// Schema for assignment validation
const assignmentSchema = zod_1.z.object({
    verifier_ids: zod_1.z.array(zod_1.z.string().uuid()),
    skill_types: zod_1.z.array(zod_1.z.string().min(1)),
    grade_ids: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    section_ids: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
// Middleware to check permissions
router.use((req, res, next) => {
    const hasPermission = req.user.role === 'SUPER_ADMIN' ||
        req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:ASSIGN') ||
        req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:VIEW') ||
        req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:DELETE');
    if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Requires SKILLS_VERIFY_ASSIGNMENT permission' });
    }
    next();
});
// Create a new assignment
router.post('/', async (req, res) => {
    try {
        const hasAssignPermission = req.user.role === 'SUPER_ADMIN' || req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:ASSIGN');
        if (!hasAssignPermission)
            return res.status(403).json({ error: 'Forbidden' });
        const parsed = assignmentSchema.parse(req.body);
        const assignment = await prisma_1.default.skillVerificationAssignment.create({
            data: {
                organization_id: req.user.organization_id,
                verifier_ids: parsed.verifier_ids,
                skill_types: parsed.skill_types,
                grade_ids: parsed.grade_ids || [],
                section_ids: parsed.section_ids || []
            }
        });
        res.status(201).json(assignment);
    }
    catch (error) {
        if (error && error.name === 'ZodError') {
            return res.status(400).json({ error: error.issues || error.errors });
        }
        if (error && error.code === 'P2002') {
            return res.status(400).json({ error: 'This verification assignment already exists.' });
        }
        console.error('Error creating assignment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all assignments
router.get('/', async (req, res) => {
    try {
        const assignments = await prisma_1.default.skillVerificationAssignment.findMany({
            where: { organization_id: req.user.organization_id },
            orderBy: { created_at: 'desc' }
        });
        const enrichedAssignments = await Promise.all(assignments.map(async (a) => {
            const verifiers = await prisma_1.default.user.findMany({
                where: { id: { in: a.verifier_ids } },
                select: { id: true, name: true, email: true, role: { select: { name: true } } }
            });
            const grades = await prisma_1.default.grade.findMany({
                where: { id: { in: a.grade_ids } },
                select: { id: true, name: true }
            });
            const sections = await prisma_1.default.section.findMany({
                where: { id: { in: a.section_ids } },
                select: { id: true, name: true }
            });
            return {
                ...a,
                verifiers,
                grades,
                sections
            };
        }));
        res.json(enrichedAssignments);
    }
    catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete an assignment
router.delete('/:id', async (req, res) => {
    try {
        const hasDeletePermission = req.user.role === 'SUPER_ADMIN' || req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:DELETE');
        if (!hasDeletePermission)
            return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        const assignment = await prisma_1.default.skillVerificationAssignment.findUnique({ where: { id } });
        if (!assignment)
            return res.status(404).json({ error: 'Assignment not found' });
        if (assignment.organization_id !== req.user.organization_id)
            return res.status(403).json({ error: 'Forbidden' });
        await prisma_1.default.skillVerificationAssignment.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update an assignment
router.put('/:id', async (req, res) => {
    try {
        const hasAssignPermission = req.user.role === 'SUPER_ADMIN' || req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:ASSIGN');
        if (!hasAssignPermission)
            return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        const parsed = assignmentSchema.parse(req.body);
        const existingAssignment = await prisma_1.default.skillVerificationAssignment.findUnique({ where: { id } });
        if (!existingAssignment)
            return res.status(404).json({ error: 'Assignment not found' });
        if (existingAssignment.organization_id !== req.user.organization_id)
            return res.status(403).json({ error: 'Forbidden' });
        const assignment = await prisma_1.default.skillVerificationAssignment.update({
            where: { id },
            data: {
                verifier_ids: parsed.verifier_ids,
                skill_types: parsed.skill_types,
                grade_ids: parsed.grade_ids || [],
                section_ids: parsed.section_ids || []
            }
        });
        res.json(assignment);
    }
    catch (error) {
        if (error && error.name === 'ZodError') {
            return res.status(400).json({ error: error.issues || error.errors });
        }
        if (error && error.code === 'P2002') {
            return res.status(400).json({ error: 'This verification assignment already exists.' });
        }
        console.error('Error updating assignment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
