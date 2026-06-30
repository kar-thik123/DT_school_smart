"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const assignment_visibility_resolver_1 = require("../utils/assignment-visibility.resolver");
const academic_context_resolver_1 = require("../utils/academic-context.resolver");
const student_enrollment_service_1 = require("../services/student-enrollment.service");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Helpers were moved to StudentEnrollmentService
// GET enrollments
router.get('/', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const { grade_id, section_id, subject_group_id } = req.query;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
        const filter = {
            organization_id: req.user.organization_id,
            academic_year_id: yearId
        };
        if (grade_id)
            filter.grade_id = String(grade_id);
        if (section_id)
            filter.section_id = String(section_id);
        if (subject_group_id) {
            filter.OR = [
                { subject_group_id: String(subject_group_id) },
                { subject_group_id: null }
            ];
        }
        const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
        if (!isGlobalAdmin) {
            const visibilityFilter = await assignment_visibility_resolver_1.AssignmentVisibilityResolver.buildTeacherSectionWhereClause(req);
            if (visibilityFilter.id) {
                if (filter.section_id) {
                    filter.AND = [
                        { section_id: filter.section_id },
                        { section_id: visibilityFilter.id }
                    ];
                    delete filter.section_id;
                }
                else {
                    filter.section_id = visibilityFilter.id;
                }
            }
        }
        const enrollments = await prisma_1.default.studentEnrollment.findMany({
            where: filter,
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        roll_number: true,
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
        const { search } = req.query;
        const academic_year_id = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
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
                roll_number: true,
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
        const { student_id, grade_id, section_id, subject_group_id, status } = req.body;
        const orgId = req.user.organization_id;
        const academic_year_id = req.academic_year_id;
        const enrollment = await student_enrollment_service_1.StudentEnrollmentService.enrollStudent(orgId, academic_year_id, {
            student_id, grade_id, section_id, subject_group_id, status
        });
        return res.json(enrollment);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
});
// POST bulk enroll
router.post('/bulk-enroll', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { student_ids, grade_id, section_id, subject_group_id } = req.body;
        const orgId = req.user.organization_id;
        const academic_year_id = req.academic_year_id;
        if (!Array.isArray(student_ids) || student_ids.length === 0 || !grade_id) {
            return res.status(400).json({ message: 'Invalid payload' });
        }
        const payloads = student_ids.map((id) => ({
            student_id: id,
            grade_id,
            section_id,
            subject_group_id,
            status: client_1.EnrollmentStatus.ACTIVE
        }));
        const result = await student_enrollment_service_1.StudentEnrollmentService.bulkEnrollStudents(orgId, academic_year_id, payloads);
        if (result.failure > 0 && result.success === 0) {
            return res.status(400).json({ message: 'All enrollments failed validation' });
        }
        return res.json({ message: 'Bulk enrollment successful', result });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
});
// POST promote
router.post('/promote', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { from_academic_year_id, promotions } = req.body;
        const to_academic_year_id = req.academic_year_id;
        const orgId = req.user.organization_id;
        // promotions: [{ student_id, from_grade_id, to_grade_id, to_section_id, to_subject_group_id }]
        if (!from_academic_year_id || !to_academic_year_id || !Array.isArray(promotions)) {
            return res.status(400).json({ message: 'Invalid payload' });
        }
        // Group validation for each promotion
        for (const promo of promotions) {
            const groupValidation = await student_enrollment_service_1.StudentEnrollmentService.validateGroupAssignment(orgId, promo.to_grade_id, promo.to_section_id, promo.to_subject_group_id);
            if (!groupValidation.allowed) {
                return res.status(400).json({ message: `Validation failed for student ${promo.student_id}: ${groupValidation.message}` });
            }
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
                await notification_service_1.NotificationService.sendNotification({
                    organization_id: orgId,
                    event_type: 'STUDENT_ENROLLMENT',
                    entity_type: 'STUDENT_ENROLLMENT',
                    entity_id: promo.student_id,
                    title: 'Student Promoted',
                    message: `You have been promoted to a new class.`,
                    context_data: { icon: 'trending-up', color: 'notification-green' },
                    recipient_ids: [promo.student_id]
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
        const { student_id } = req.params;
        const academic_year_id = req.academic_year_id;
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
        const targetGradeId = grade_id || existing.grade_id;
        // Group validation
        const groupValidation = await student_enrollment_service_1.StudentEnrollmentService.validateGroupAssignment(orgId, targetGradeId, section_id, subject_group_id);
        if (!groupValidation.allowed) {
            return res.status(400).json({ message: groupValidation.message });
        }
        if (section_id && section_id !== existing.section_id) {
            // Mock existing capacity check behavior here for edits, but using full logic would be better.
            // However, `enrollStudent` method does this cleanly. To avoid breaking edits, we keep it simple.
            const section = await prisma_1.default.section.findUnique({ where: { id: section_id } });
            if (section && section.capacity) {
                const currentCount = await prisma_1.default.studentEnrollment.count({
                    where: { section_id, organization_id: orgId, status: client_1.EnrollmentStatus.ACTIVE }
                });
                if (currentCount + 1 > section.capacity)
                    return res.status(400).json({ message: 'Section capacity exceeded' });
            }
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
        // Group validation
        const groupValidation = await student_enrollment_service_1.StudentEnrollmentService.validateGroupAssignment(orgId, to_grade_id, to_section_id, to_subject_group_id);
        if (!groupValidation.allowed) {
            return res.status(400).json({ message: groupValidation.message });
        }
        if (to_section_id && to_section_id !== existing.section_id) {
            const section = await prisma_1.default.section.findUnique({ where: { id: to_section_id } });
            if (section && section.capacity) {
                const currentCount = await prisma_1.default.studentEnrollment.count({
                    where: { section_id: to_section_id, organization_id: orgId, status: client_1.EnrollmentStatus.ACTIVE }
                });
                if (currentCount + 1 > section.capacity)
                    return res.status(400).json({ message: 'Section capacity exceeded' });
            }
        }
        await prisma_1.default.$transaction(async (tx) => {
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
            await notification_service_1.NotificationService.sendNotification({
                organization_id: orgId,
                event_type: 'STUDENT_ENROLLMENT',
                entity_type: 'STUDENT_ENROLLMENT',
                entity_id: existing.student_id,
                title: 'Class Transfer',
                message: `You have been transferred to a new class.`,
                context_data: { icon: 'refresh-cw', color: 'notification-blue' },
                recipient_ids: [existing.student_id]
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
            await notification_service_1.NotificationService.sendNotification({
                organization_id: orgId,
                event_type: 'STUDENT_ENROLLMENT',
                entity_type: 'STUDENT_ENROLLMENT',
                entity_id: existing.student_id,
                title: 'Enrollment Activated',
                message: `Your enrollment has been activated.`,
                context_data: { icon: 'check-circle', color: 'notification-green' },
                recipient_ids: [existing.student_id]
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
            await notification_service_1.NotificationService.sendNotification({
                organization_id: orgId,
                event_type: 'STUDENT_ENROLLMENT',
                entity_type: 'STUDENT_ENROLLMENT',
                entity_id: existing.student_id,
                title: 'Enrollment Withdrawn',
                message: `Your enrollment has been withdrawn.`,
                context_data: { icon: 'x-circle', color: 'notification-red' },
                recipient_ids: [existing.student_id]
            });
        });
        return res.json({ message: 'Student withdrawn successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// GET export
router.get('/export', (0, auth_middleware_1.requirePermission)('STUDENT_ENROLLMENT', 'EXPORT'), async (req, res) => {
    try {
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
        const orgId = req.user.organization_id;
        const enrollments = await prisma_1.default.studentEnrollment.findMany({
            where: { organization_id: orgId, academic_year_id: yearId },
            include: {
                student: { select: { email: true } },
                grade: { select: { name: true } },
                section: { select: { name: true } },
                subject_group: { select: { name: true } }
            }
        });
        const csvHeaders = ['student_email', 'grade_name', 'section_name', 'group_name'];
        let csvContent = csvHeaders.join(',') + '\n';
        for (const enr of enrollments) {
            const row = [
                enr.student?.email || '',
                enr.grade?.name || '',
                enr.section?.name || '',
                enr.subject_group?.name || ''
            ];
            // Escape commas and quotes
            const escapedRow = row.map(col => `"${col.replace(/"/g, '""')}"`);
            csvContent += escapedRow.join(',') + '\n';
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=student_enrollments.csv');
        return res.send(csvContent);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
