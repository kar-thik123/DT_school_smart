"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Helper to check capacity
async function checkSectionCapacity(sectionId, orgId, addedCount = 1) {
    const section = await prisma_1.default.section.findUnique({ where: { id: sectionId } });
    if (!section || !section.capacity)
        return { allowed: true };
    // Count active enrollments in this section
    const currentCount = await prisma_1.default.studentEnrollment.count({
        where: { section_id: sectionId, organization_id: orgId, status: client_1.EnrollmentStatus.ACTIVE }
    });
    if (currentCount + addedCount > section.capacity) {
        return { allowed: false, message: `Section capacity exceeded. Max: ${section.capacity}, Current: ${currentCount}, Adding: ${addedCount}` };
    }
    return { allowed: true };
}
// GET enrollments
router.get('/', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const { academic_year_id, grade_id, section_id } = req.query;
        const filter = { organization_id: req.user.organization_id };
        if (academic_year_id)
            filter.academic_year_id = String(academic_year_id);
        if (grade_id)
            filter.grade_id = String(grade_id);
        if (section_id)
            filter.section_id = String(section_id);
        const enrollments = await prisma_1.default.studentEnrollment.findMany({
            where: filter,
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        student_profile: true
                    }
                },
                academic_year: true,
                grade: true,
                section: true,
                subject_group: true
            }
        });
        res.json(enrollments);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET active students without enrollment for a specific year
router.get('/unenrolled', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const { academic_year_id, search } = req.query;
        if (!academic_year_id)
            return res.status(400).json({ message: 'academic_year_id required' });
        const searchFilter = search ? {
            OR: [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { student_profile: { admission_number: { contains: String(search), mode: 'insensitive' } } },
                { student_profile: { mobile_number: { contains: String(search), mode: 'insensitive' } } }
            ]
        } : {};
        // Find all active students matching the search — exclude teachers and admins
        const students = await prisma_1.default.user.findMany({
            where: {
                organization_id: req.user.organization_id,
                is_active: true,
                role: {
                    permissions: {
                        some: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } }
                    },
                    AND: [
                        {
                            permissions: {
                                none: { permission: { module: 'IDENTITY', action: 'IS_TEACHER' } }
                            }
                        },
                        {
                            permissions: {
                                none: { permission: { module: 'IDENTITY', action: 'IS_MANAGEMENT' } }
                            }
                        }
                    ]
                },
                ...searchFilter
            },
            select: {
                id: true,
                name: true,
                email: true,
                student_profile: true
            }
        });
        // Find enrolled student IDs for this year
        const enrollments = await prisma_1.default.studentEnrollment.findMany({
            where: { organization_id: req.user.organization_id, academic_year_id: String(academic_year_id) },
            select: { student_id: true }
        });
        const enrolledIds = new Set(enrollments.map((e) => e.student_id));
        // Filter unenrolled
        const unenrolled = students.filter((s) => !enrolledIds.has(s.id));
        res.json(unenrolled);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST individual enrollment mapping
router.post('/map', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { student_id, academic_year_id, grade_id, section_id, subject_group_id, status } = req.body;
        const orgId = req.user.organization_id;
        if (!student_id || !academic_year_id || !grade_id) {
            return res.status(400).json({ message: 'student_id, academic_year_id, grade_id required' });
        }
        // Capacity check if section provided
        if (section_id) {
            // Find existing enrollment to see if section is changing
            const existing = await prisma_1.default.studentEnrollment.findUnique({
                where: { student_id_academic_year_id_organization_id: { student_id, academic_year_id, organization_id: orgId } }
            });
            if (!existing || existing.section_id !== section_id) {
                const cap = await checkSectionCapacity(section_id, orgId, 1);
                if (!cap.allowed)
                    return res.status(400).json({ message: cap.message });
            }
        }
        const enrollment = await prisma_1.default.studentEnrollment.upsert({
            where: {
                student_id_academic_year_id_organization_id: {
                    student_id, academic_year_id, organization_id: orgId
                }
            },
            update: { grade_id, section_id, subject_group_id, status: status || client_1.EnrollmentStatus.ACTIVE },
            create: {
                organization_id: orgId,
                student_id, academic_year_id, grade_id, section_id, subject_group_id, status: status || client_1.EnrollmentStatus.ACTIVE
            }
        });
        // Update the transitional fields on User model safely within tenant scope
        await prisma_1.default.user.updateMany({
            where: { id: student_id, organization_id: orgId },
            data: { grade_id, section_id }
        });
        return res.json(enrollment);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// POST bulk enroll
router.post('/bulk-enroll', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { student_ids, academic_year_id, grade_id, section_id, subject_group_id } = req.body;
        const orgId = req.user.organization_id;
        if (!Array.isArray(student_ids) || student_ids.length === 0 || !academic_year_id || !grade_id) {
            return res.status(400).json({ message: 'Invalid payload' });
        }
        if (section_id) {
            const cap = await checkSectionCapacity(section_id, orgId, student_ids.length);
            if (!cap.allowed)
                return res.status(400).json({ message: cap.message });
        }
        await prisma_1.default.$transaction(async (tx) => {
            for (const student_id of student_ids) {
                await tx.studentEnrollment.upsert({
                    where: { student_id_academic_year_id_organization_id: { student_id, academic_year_id, organization_id: orgId } },
                    update: { grade_id, section_id: section_id || null, subject_group_id: subject_group_id || null, status: client_1.EnrollmentStatus.ACTIVE },
                    create: { organization_id: orgId, student_id, academic_year_id, grade_id, section_id: section_id || null, subject_group_id: subject_group_id || null, status: client_1.EnrollmentStatus.ACTIVE }
                });
                await tx.user.updateMany({
                    where: { id: student_id, organization_id: orgId },
                    data: { grade_id, section_id: section_id || null }
                });
            }
        });
        return res.json({ message: 'Bulk enrollment successful' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// POST promote
router.post('/promote', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { from_academic_year_id, to_academic_year_id, promotions } = req.body;
        const orgId = req.user.organization_id;
        // promotions: [{ student_id, from_grade_id, to_grade_id, to_section_id, to_subject_group_id }]
        if (!from_academic_year_id || !to_academic_year_id || !Array.isArray(promotions)) {
            return res.status(400).json({ message: 'Invalid payload' });
        }
        await prisma_1.default.$transaction(async (tx) => {
            for (const promo of promotions) {
                // Mark old enrollment as PROMOTED
                await tx.studentEnrollment.updateMany({
                    where: { student_id: promo.student_id, academic_year_id: from_academic_year_id, organization_id: orgId },
                    data: { status: client_1.EnrollmentStatus.PROMOTED }
                });
                // Create new enrollment
                await tx.studentEnrollment.upsert({
                    where: { student_id_academic_year_id_organization_id: { student_id: promo.student_id, academic_year_id: to_academic_year_id, organization_id: orgId } },
                    update: { grade_id: promo.to_grade_id, section_id: promo.to_section_id, subject_group_id: promo.to_subject_group_id, status: client_1.EnrollmentStatus.ACTIVE },
                    create: { organization_id: orgId, student_id: promo.student_id, academic_year_id: to_academic_year_id, grade_id: promo.to_grade_id, section_id: promo.to_section_id, subject_group_id: promo.to_subject_group_id, status: client_1.EnrollmentStatus.ACTIVE }
                });
                // Record history
                await tx.promotionHistory.create({
                    data: {
                        organization_id: orgId,
                        student_id: promo.student_id,
                        from_academic_year_id,
                        to_academic_year_id,
                        from_grade_id: promo.from_grade_id,
                        to_grade_id: promo.to_grade_id,
                        promoted_by: req.user.user_id
                    }
                });
                // Update User cache safely within tenant scope
                await tx.user.updateMany({
                    where: { id: promo.student_id, organization_id: orgId },
                    data: { grade_id: promo.to_grade_id, section_id: promo.to_section_id }
                });
            }
        });
        res.json({ message: 'Promotions successful' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE unassign enrollment
router.delete('/:student_id/:academic_year_id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { student_id, academic_year_id } = req.params;
        const orgId = req.user.organization_id;
        await prisma_1.default.$transaction(async (tx) => {
            // Delete the enrollment record
            await tx.studentEnrollment.delete({
                where: {
                    student_id_academic_year_id_organization_id: {
                        student_id,
                        academic_year_id,
                        organization_id: orgId
                    }
                }
            });
            // Nullify the current grade and section on the User safely within tenant scope
            await tx.user.updateMany({
                where: { id: student_id, organization_id: orgId },
                data: { grade_id: null, section_id: null }
            });
        });
        return res.json({ message: 'Enrollment deleted successfully' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        return res.status(500).json({ error: error.message });
    }
});
// PUT edit enrollment (Correction only, no history)
router.put('/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { grade_id, section_id, subject_group_id } = req.body;
        const orgId = req.user.organization_id;
        const existing = await prisma_1.default.studentEnrollment.findUnique({ where: { id: req.params.id } });
        if (!existing || existing.organization_id !== orgId) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        if (section_id && section_id !== existing.section_id) {
            const cap = await checkSectionCapacity(section_id, orgId, 1);
            if (!cap.allowed)
                return res.status(400).json({ message: cap.message });
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const enr = await tx.studentEnrollment.update({
                where: { id: req.params.id },
                data: { grade_id, section_id, subject_group_id }
            });
            await tx.user.update({
                where: { id: existing.student_id },
                data: { grade_id, section_id }
            });
            return enr;
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// POST transfer student
router.post('/:id/transfer', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { to_grade_id, to_section_id, to_subject_group_id, reason } = req.body;
        const orgId = req.user.organization_id;
        const existing = await prisma_1.default.studentEnrollment.findUnique({ where: { id: req.params.id } });
        if (!existing || existing.organization_id !== orgId) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        if (to_section_id && to_section_id !== existing.section_id) {
            const cap = await checkSectionCapacity(to_section_id, orgId, 1);
            if (!cap.allowed)
                return res.status(400).json({ message: cap.message });
        }
        await prisma_1.default.$transaction(async (tx) => {
            // @ts-ignore - Prisma client needs regeneration by user later
            await tx.studentTransferHistory.create({
                data: {
                    organization_id: orgId,
                    student_id: existing.student_id,
                    academic_year_id: existing.academic_year_id,
                    from_grade_id: existing.grade_id,
                    from_section_id: existing.section_id,
                    from_subject_group_id: existing.subject_group_id,
                    to_grade_id,
                    to_section_id,
                    to_subject_group_id,
                    reason,
                    created_by: req.user.user_id
                }
            });
            await tx.studentEnrollment.update({
                where: { id: req.params.id },
                data: { grade_id: to_grade_id, section_id: to_section_id, subject_group_id: to_subject_group_id }
            });
            await tx.user.update({
                where: { id: existing.student_id },
                data: { grade_id: to_grade_id, section_id: to_section_id }
            });
        });
        return res.json({ message: 'Transfer successful' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// PATCH activate student
router.patch('/:id/activate', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const orgId = req.user.organization_id;
        const existing = await prisma_1.default.studentEnrollment.findUnique({ where: { id: req.params.id } });
        if (!existing || existing.organization_id !== orgId) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.studentEnrollment.update({
                where: { id: req.params.id },
                data: { status: client_1.EnrollmentStatus.ACTIVE }
            });
            await tx.user.update({
                where: { id: existing.student_id },
                data: { grade_id: existing.grade_id, section_id: existing.section_id }
            });
        });
        return res.json({ message: 'Student activated successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// PATCH withdraw student
router.patch('/:id/withdraw', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { reason } = req.body;
        const orgId = req.user.organization_id;
        const existing = await prisma_1.default.studentEnrollment.findUnique({ where: { id: req.params.id } });
        if (!existing || existing.organization_id !== orgId) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.studentEnrollment.update({
                where: { id: req.params.id },
                data: { status: client_1.EnrollmentStatus.WITHDRAWN }
            });
            await tx.user.update({
                where: { id: existing.student_id },
                data: { grade_id: null, section_id: null }
            });
        });
        return res.json({ message: 'Student withdrawn successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
