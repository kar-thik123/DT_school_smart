import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { EnrollmentStatus } from '@prisma/client';

const router = Router();
router.use(authMiddleware);

// Helper to check capacity
async function checkSectionCapacity(sectionId: string, orgId: string, addedCount = 1) {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section || !section.capacity) return { allowed: true };

  // Count active enrollments in this section
  const currentCount = await prisma.studentEnrollment.count({
    where: { section_id: sectionId, organization_id: orgId, status: EnrollmentStatus.ACTIVE }
  });

  if (currentCount + addedCount > section.capacity) {
    return { allowed: false, message: `Section capacity exceeded. Max: ${section.capacity}, Current: ${currentCount}, Adding: ${addedCount}` };
  }
  return { allowed: true };
}

// GET enrollments
router.get('/', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: any, res: Response) => {
  try {
    const { academic_year_id, grade_id, section_id } = req.query;
    const filter: any = { organization_id: req.user.organization_id };
    if (academic_year_id) filter.academic_year_id = String(academic_year_id);
    if (grade_id) filter.grade_id = String(grade_id);
    if (section_id) filter.section_id = String(section_id);

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
    const { academic_year_id, search } = req.query;
    if (!academic_year_id) return res.status(400).json({ message: 'academic_year_id required' });

    const searchFilter = search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' as const } },
        { email: { contains: String(search), mode: 'insensitive' as const } },
        { student_profile: { admission_number: { contains: String(search), mode: 'insensitive' as const } } },
        { student_profile: { mobile_number: { contains: String(search), mode: 'insensitive' as const } } }
      ]
    } : {};

    // Find all active students matching the search
    const students = await prisma.user.findMany({
      where: { 
        organization_id: req.user.organization_id, 
        role: { permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } } } }, 
        is_active: true,
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
    const { student_id, academic_year_id, grade_id, section_id, subject_group_id, status } = req.body;
    const orgId = req.user.organization_id;

    if (!student_id || !academic_year_id || !grade_id) {
      return res.status(400).json({ message: 'student_id, academic_year_id, grade_id required' });
    }

    // Capacity check if section provided
    if (section_id) {
      // Find existing enrollment to see if section is changing
      const existing = await prisma.studentEnrollment.findUnique({
        where: { student_id_academic_year_id_organization_id: { student_id, academic_year_id, organization_id: orgId } }
      });
      if (!existing || existing.section_id !== section_id) {
        const cap = await checkSectionCapacity(section_id, orgId, 1);
        if (!cap.allowed) return res.status(400).json({ message: cap.message });
      }
    }

    const enrollment = await prisma.studentEnrollment.upsert({
      where: {
        student_id_academic_year_id_organization_id: {
          student_id, academic_year_id, organization_id: orgId
        }
      },
      update: { grade_id, section_id, subject_group_id, status: status || EnrollmentStatus.ACTIVE },
      create: {
        organization_id: orgId,
        student_id, academic_year_id, grade_id, section_id, subject_group_id, status: status || EnrollmentStatus.ACTIVE
      }
    });

    // Update the transitional fields on User model
    await prisma.user.update({
      where: { id: student_id },
      data: { grade_id, section_id }
    });

    return res.json(enrollment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST bulk enroll
router.post('/bulk-enroll', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { student_ids, academic_year_id, grade_id, section_id, subject_group_id } = req.body;
    const orgId = req.user.organization_id;

    if (!Array.isArray(student_ids) || student_ids.length === 0 || !academic_year_id || !grade_id) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    if (section_id) {
       const cap = await checkSectionCapacity(section_id, orgId, student_ids.length);
       if (!cap.allowed) return res.status(400).json({ message: cap.message });
    }

    await prisma.$transaction(async (tx: any) => {
      for (const student_id of student_ids) {
        await tx.studentEnrollment.upsert({
          where: { student_id_academic_year_id_organization_id: { student_id, academic_year_id, organization_id: orgId } },
          update: { grade_id, section_id: section_id || null, subject_group_id: subject_group_id || null, status: EnrollmentStatus.ACTIVE },
          create: { organization_id: orgId, student_id, academic_year_id, grade_id, section_id: section_id || null, subject_group_id: subject_group_id || null, status: EnrollmentStatus.ACTIVE }
        });

        await tx.user.update({
          where: { id: student_id },
          data: { grade_id, section_id: section_id || null }
        });
      }
    });

    return res.json({ message: 'Bulk enrollment successful' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST promote
router.post('/promote', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { from_academic_year_id, to_academic_year_id, promotions } = req.body;
    const orgId = req.user.organization_id;

    // promotions: [{ student_id, from_grade_id, to_grade_id, to_section_id, to_subject_group_id }]
    if (!from_academic_year_id || !to_academic_year_id || !Array.isArray(promotions)) {
      return res.status(400).json({ message: 'Invalid payload' });
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

        // Update User cache
        await tx.user.update({
          where: { id: promo.student_id },
          data: { grade_id: promo.to_grade_id, section_id: promo.to_section_id }
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
    const { student_id, academic_year_id } = req.params;
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

      // Nullify the current grade and section on the User
      await tx.user.update({
        where: { id: student_id },
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

    if (section_id && section_id !== existing.section_id) {
       const cap = await checkSectionCapacity(section_id, orgId, 1);
       if (!cap.allowed) return res.status(400).json({ message: cap.message });
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

    if (to_section_id && to_section_id !== existing.section_id) {
       const cap = await checkSectionCapacity(to_section_id, orgId, 1);
       if (!cap.allowed) return res.status(400).json({ message: cap.message });
    }

    await prisma.$transaction(async (tx: any) => {
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
    });

    return res.json({ message: 'Student withdrawn successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
