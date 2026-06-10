import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { EnrollmentStatus } from '@prisma/client';
import { AssignmentVisibilityResolver } from '../utils/assignment-visibility.resolver';
import { AcademicContextResolver } from '../utils/academic-context.resolver';
import { StudentEnrollmentService } from '../services/student-enrollment.service';
import { NotificationService } from '../services/notification.service';

const router = Router();
router.use(authMiddleware);

// Helpers were moved to StudentEnrollmentService

// GET enrollments
router.get('/', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: any, res: Response) => {
  try {
    const { grade_id, section_id } = req.query;
    const yearId = await AcademicContextResolver.resolveAcademicYearId(req);
    const filter: any = { 
      organization_id: req.user.organization_id,
      academic_year_id: yearId
    };
    if (grade_id) filter.grade_id = String(grade_id);
    if (section_id) filter.section_id = String(section_id);

    const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
    if (!isGlobalAdmin) {
      const visibilityFilter = await AssignmentVisibilityResolver.buildTeacherSectionWhereClause(req);
      if (visibilityFilter.id) filter.section_id = visibilityFilter.id; // Either IN array or no-access
    }

    const enrollments = await prisma.studentEnrollment.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET active students without enrollment for a specific year
router.get('/unenrolled', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: any, res: Response) => {
  try {
    const { search } = req.query;
    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);

    const searchFilter = search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' as const } },
        { email: { contains: String(search), mode: 'insensitive' as const } },
        { student_profile: { admission_number: { contains: String(search), mode: 'insensitive' as const } } },
        { student_profile: { mobile_number: { contains: String(search), mode: 'insensitive' as const } } }
      ]
    } : {};

    // Find all active students matching the search — exclude teachers and admins
    const students = await prisma.user.findMany({
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
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { organization_id: req.user.organization_id, academic_year_id: String(academic_year_id) },
      select: { student_id: true }
    });
    const enrolledIds = new Set(enrollments.map((e: any) => e.student_id));

    // Filter unenrolled
    const unenrolled = students.filter((s: any) => !enrolledIds.has(s.id));
    res.json(unenrolled);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST individual enrollment mapping
router.post('/map', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { student_id, grade_id, section_id, subject_group_id, status } = req.body;
    const orgId = req.user.organization_id;
    const academic_year_id = req.academic_year_id;

    const enrollment = await StudentEnrollmentService.enrollStudent(orgId, academic_year_id, {
      student_id, grade_id, section_id, subject_group_id, status
    });

    return res.json(enrollment);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// POST bulk enroll
router.post('/bulk-enroll', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { student_ids, grade_id, section_id, subject_group_id } = req.body;
    const orgId = req.user.organization_id;
    const academic_year_id = req.academic_year_id;

    if (!Array.isArray(student_ids) || student_ids.length === 0 || !grade_id) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const payloads = student_ids.map((id: string) => ({
      student_id: id,
      grade_id,
      section_id,
      subject_group_id,
      status: EnrollmentStatus.ACTIVE
    }));

    const result = await StudentEnrollmentService.bulkEnrollStudents(orgId, academic_year_id, payloads);
    
    if (result.failure > 0 && result.success === 0) {
       return res.status(400).json({ message: 'All enrollments failed validation' });
    }

    return res.json({ message: 'Bulk enrollment successful', result });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// POST promote
router.post('/promote', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
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
      const groupValidation = await StudentEnrollmentService.validateGroupAssignment(orgId, promo.to_grade_id, promo.to_section_id, promo.to_subject_group_id);
      if (!groupValidation.allowed) {
        return res.status(400).json({ message: `Validation failed for student ${promo.student_id}: ${groupValidation.message}` });
      }
    }

    await prisma.$transaction(async (tx: any) => {
      for (const promo of promotions) {
        // Mark old enrollment as PROMOTED
        await tx.studentEnrollment.updateMany({
          where: { student_id: promo.student_id, academic_year_id: from_academic_year_id, organization_id: orgId },
          data: { status: EnrollmentStatus.PROMOTED }
        });

        // Create new enrollment
        await tx.studentEnrollment.upsert({
          where: { student_id_academic_year_id_organization_id: { student_id: promo.student_id, academic_year_id: to_academic_year_id, organization_id: orgId } },
          update: { grade_id: promo.to_grade_id, section_id: promo.to_section_id, subject_group_id: promo.to_subject_group_id, status: EnrollmentStatus.ACTIVE },
          create: { organization_id: orgId, student_id: promo.student_id, academic_year_id: to_academic_year_id, grade_id: promo.to_grade_id, section_id: promo.to_section_id, subject_group_id: promo.to_subject_group_id, status: EnrollmentStatus.ACTIVE }
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

        await NotificationService.sendNotification({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE unassign enrollment
router.delete('/:student_id/:academic_year_id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { student_id } = req.params;
    const academic_year_id = req.academic_year_id;
    const orgId = req.user.organization_id;

    await prisma.$transaction(async (tx: any) => {
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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    return res.status(500).json({ error: error.message });
  }
});

// PUT edit enrollment (Correction only, no history)
router.put('/:id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { grade_id, section_id, subject_group_id } = req.body;
    const orgId = req.user.organization_id;

    const existing = await prisma.studentEnrollment.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.organization_id !== orgId) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const targetGradeId = grade_id || existing.grade_id;

    // Group validation
    const groupValidation = await StudentEnrollmentService.validateGroupAssignment(orgId, targetGradeId, section_id, subject_group_id);
    if (!groupValidation.allowed) {
      return res.status(400).json({ message: groupValidation.message });
    }

    if (section_id && section_id !== existing.section_id) {
       // Mock existing capacity check behavior here for edits, but using full logic would be better.
       // However, `enrollStudent` method does this cleanly. To avoid breaking edits, we keep it simple.
       const section = await prisma.section.findUnique({ where: { id: section_id } });
       if (section && section.capacity) {
         const currentCount = await prisma.studentEnrollment.count({
           where: { section_id, organization_id: orgId, status: EnrollmentStatus.ACTIVE }
         });
         if (currentCount + 1 > section.capacity) return res.status(400).json({ message: 'Section capacity exceeded' });
       }
    }

    const updated = await prisma.$transaction(async (tx: any) => {
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST transfer student
router.post('/:id/transfer', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { to_grade_id, to_section_id, to_subject_group_id, reason } = req.body;
    const orgId = req.user.organization_id;

    const existing = await prisma.studentEnrollment.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.organization_id !== orgId) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Group validation
    const groupValidation = await StudentEnrollmentService.validateGroupAssignment(orgId, to_grade_id, to_section_id, to_subject_group_id);
    if (!groupValidation.allowed) {
      return res.status(400).json({ message: groupValidation.message });
    }

    if (to_section_id && to_section_id !== existing.section_id) {
       const section = await prisma.section.findUnique({ where: { id: to_section_id } });
       if (section && section.capacity) {
         const currentCount = await prisma.studentEnrollment.count({
           where: { section_id: to_section_id, organization_id: orgId, status: EnrollmentStatus.ACTIVE }
         });
         if (currentCount + 1 > section.capacity) return res.status(400).json({ message: 'Section capacity exceeded' });
       }
    }

    await prisma.$transaction(async (tx: any) => {
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

      await NotificationService.sendNotification({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH activate student
router.patch('/:id/activate', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;

    const existing = await prisma.studentEnrollment.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.organization_id !== orgId) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.studentEnrollment.update({
        where: { id: req.params.id },
        data: { status: EnrollmentStatus.ACTIVE }
      });
      
      await tx.user.update({
        where: { id: existing.student_id },
        data: { grade_id: existing.grade_id, section_id: existing.section_id }
      });

      await NotificationService.sendNotification({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH withdraw student
router.patch('/:id/withdraw', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { reason } = req.body;
    const orgId = req.user.organization_id;

    const existing = await prisma.studentEnrollment.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.organization_id !== orgId) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.studentEnrollment.update({
        where: { id: req.params.id },
        data: { status: EnrollmentStatus.WITHDRAWN }
      });
      
      await tx.user.update({
        where: { id: existing.student_id },
        data: { grade_id: null, section_id: null }
      });

      await NotificationService.sendNotification({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET export
router.get('/export', requirePermission('STUDENT_ENROLLMENT', 'EXPORT'), async (req: any, res: Response) => {
  try {
    const yearId = await AcademicContextResolver.resolveAcademicYearId(req);
    const orgId = req.user.organization_id;

    const enrollments = await prisma.studentEnrollment.findMany({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
