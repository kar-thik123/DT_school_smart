import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { getActiveAcademicYearId } from '../utils/academic-helper';
import { AssignmentVisibilityResolver } from '../utils/assignment-visibility.resolver';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { randomUUID } from 'crypto';
import { logAuditEvent } from '../services/audit.service';
import { NotificationService } from '../services/notification.service';

const upload = multer();

const router = Router();
router.use(authMiddleware);

// A helper function to create generic CRUD handlers
const createCrudHandlers = (modelName: string, prismaModel: any) => {
  const modelRouter = Router();

  // Read
  modelRouter.get('/', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: any, res: Response) => {
    try {
      const hasSortOrder = ['Section', 'Unit', 'Topic'].includes(modelName);
      
      let filter: any = { organization_id: req.user.organization_id };
      
      const isGlobalAdmin = req.user.permissions?.includes('ACADEMIC_STRUCTURE:READ') || req.user.permissions?.includes('ACADEMIC_STRUCTURE:VIEW');
      if (!isGlobalAdmin && modelName === 'Section') {
        const visibilityFilter = await AssignmentVisibilityResolver.buildTeacherSectionWhereClause(req);
        if (visibilityFilter.id) filter.id = visibilityFilter.id;
      }

      const data = await prismaModel.findMany({
        where: filter,
        ...(hasSortOrder ? { orderBy: { sort_order: 'asc' } } : {})
      });
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: `Error fetching ${modelName}` });
    }
  });

  // Create
  modelRouter.post('/', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
    try {
      const data = await prismaModel.create({
        data: { ...req.body, organization_id: req.user.organization_id }
      });
      res.status(201).json({ message: `${modelName} created`, data });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating ${modelName}`, error: error.message });
    }
  });

  // Edit (Update)
  modelRouter.put('/:id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
    try {
      // If ID is not a valid UUID, findFirst will throw Prisma error in some environments, or we check existence
      const existing = await prismaModel.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
      if (!existing) return res.status(404).json({ message: 'Not found' });

      // const data = await prismaModel.update({
      //   where: { id: req.params.id },
      //   data: req.body

      // Security Fix: Prevent cross-tenant data leakage by ensuring organization_id cannot be overwritten
      const { id, organization_id, ...safeData } = req.body;

      const data = await prismaModel.update({
        where: { id: req.params.id },
        data: safeData

      });

      if (modelName === 'Section') {
        const admins = await prisma.user.findMany({
          where: { organization_id: req.user.organization_id, role: { name: { in: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] } } }
        });
        await NotificationService.sendNotification({
          organization_id: req.user.organization_id,
          event_type: 'ACADEMIC_MANAGEMENT',
          entity_type: 'SECTION',
          entity_id: data.id,
          title: 'Section Updated',
          message: `Section details have been updated.`,
          context_data: { icon: 'edit', color: 'notification-blue' },
          recipient_ids: admins.map((a: any) => a.id)
        });
      }

      res.json({ message: `${modelName} updated`, data });
    } catch (error: any) {
      // Prisma error for invalid ID format or record not found
      if (error.code === 'P2023' || error.code === 'P2025' || error.message?.includes('invalid input syntax for type uuid')) {
        return res.status(404).json({ message: 'Not found' });
      }
      console.error(`Error updating ${modelName}:`, error);
      res.status(400).json({ message: `Error updating ${modelName}`, error: error.message });
    }
  });

  // Delete
  modelRouter.delete('/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: any, res: Response) => {
    try {
      const existing = await prismaModel.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
      if (!existing) return res.status(404).json({ message: 'Not found' });

      await prismaModel.delete({ where: { id: req.params.id } });
      res.json({ message: `${modelName} deleted` });
    } catch (error: any) {
      if (error.code === 'P2023' || error.code === 'P2025' || error.message?.includes('invalid input syntax for type uuid')) {
        return res.status(404).json({ message: 'Not found' });
      }
      console.error(`Error deleting ${modelName}:`, error);
      res.status(400).json({ message: `Error deleting ${modelName}`, error: error.message });
    }
  });

  return modelRouter;
};

// Registering all generic CRUD routes
router.use('/boards', createCrudHandlers('Board', prisma.board));
router.use('/mediums', createCrudHandlers('Medium', prisma.medium));
router.use('/organization-types', createCrudHandlers('OrganizationType', prisma.organizationType));
router.use('/academic-years', createCrudHandlers('AcademicYear', prisma.academicYear));

// ── Academic Year Activation ──────────────────────────────────────────────────
router.post('/academic-years/:id/activate', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const yearId = req.params.id;
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        message: 'Confirmation required. Reverting the Active Academic Year acts as a rollback because data remains stored under its original academic_year_id. Send { confirm: true } to proceed.'
      });
    }

    const yearToActivate = await prisma.academicYear.findFirst({
      where: { id: yearId, organization_id: orgId }
    });

    if (!yearToActivate) {
      return res.status(404).json({ message: 'Academic Year not found' });
    }

    await prisma.$transaction([
      // Enforce one ACTIVE year: mark all others as not active
      prisma.academicYear.updateMany({
        where: { organization_id: orgId },
        data: { is_active: false }
      }),
      // Set the requested one to ACTIVE
      prisma.academicYear.update({
        where: { id: yearId },
        data: { is_active: true }
      })
    ]);

    const admins = await prisma.user.findMany({
      where: { organization_id: orgId }
    });
    if (admins.length > 0) {
      await NotificationService.sendNotification({
        organization_id: orgId,
        event_type: 'ACADEMIC_MANAGEMENT',
        entity_type: 'ACADEMIC_YEAR',
        entity_id: yearId,
        title: 'Academic Year Activated',
        message: `Academic Year ${yearToActivate.name} is now ACTIVE.`,
        context_data: { icon: 'calendar', color: 'notification-green' },
        recipient_ids: admins.map((a: any) => a.id)
      });
    }

    res.json({ message: `Academic Year ${yearToActivate.name} is now ACTIVE.` });
  } catch (error: any) {
    res.status(500).json({ message: 'Error activating academic year', error: error.message });
  }
});

// ── Active Academic Year ─────────────────────────────────────────────────────
// GET /api/academic/active-year — no special permission required, available to
// all authenticated users so that modules like Teacher Assignment can read it.
router.get('/active-year', async (req: any, res: Response) => {
  try {
    const activeYearId = await getActiveAcademicYearId(req.user.organization_id);
    const activeYear = await prisma.academicYear.findUnique({
      where: { id: activeYearId }
    });
    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year configured' });
    }
    res.json(activeYear);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching active academic year', error: error.message });
  }
});

// ── Generic Reorder Endpoint ────────────────────────────────────────────────
router.put('/reorder/:model', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { model } = req.params;
    const { items } = req.body; // Array of { id, sort_order }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid payload: items array required' });
    }

    const validModels: Record<string, any> = {
      grades: prisma.grade,
      sections: prisma.section,
      subjects: prisma.subject
    };

    const prismaModel = validModels[model.toLowerCase()];
    if (!prismaModel) return res.status(400).json({ message: 'Invalid model for reordering' });

    await prisma.$transaction(
      items.map((item: any) =>
        prismaModel.update({
          where: { id: item.id },
          data: { sort_order: item.sort_order }
        })
      )
    );

    res.json({ message: 'Reordered successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error reordering items', error: error.message });
  }
});

// ── Grades: custom handler — auto-resolves academic_year_id ──────────────────
const gradeRouter = Router();

gradeRouter.get('/', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: any, res: Response) => {
  try {
    const isGlobalAdmin = req.user.permissions?.includes('ACADEMIC_STRUCTURE:READ') || req.user.permissions?.includes('ACADEMIC_STRUCTURE:VIEW');
    
    let filter: any = { organization_id: req.user.organization_id };
    if (!isGlobalAdmin) {
      const visibilityFilter = await AssignmentVisibilityResolver.buildTeacherGradeWhereClause(req);
      if (visibilityFilter.id) filter.id = visibilityFilter.id;
    }

    const data = await prisma.grade.findMany({
      where: filter,
      include: { academic_year: true },
      orderBy: { sort_order: 'asc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Grades fetch error:', error);
    res.status(500).json({ message: 'Error fetching Grades' });
  }
});

gradeRouter.get('/assigned', async (req: any, res: Response) => {
  try {
    const isGlobalAdmin = req.user.permissions?.includes('ACADEMIC_STRUCTURE:READ') || req.user.permissions?.includes('ACADEMIC_STRUCTURE:VIEW');
    
    let filter: any = { organization_id: req.user.organization_id };
    if (!isGlobalAdmin) {
      const visibilityFilter = await AssignmentVisibilityResolver.buildTeacherGradeWhereClause(req);
      if (visibilityFilter.id) filter.id = visibilityFilter.id;
    }

    const data = await prisma.grade.findMany({
      where: filter,
      include: { academic_year: true },
      orderBy: { sort_order: 'asc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assigned Grades' });
  }
});

gradeRouter.post('/', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
  try {
    const rawName = req.body.name;
    if (!rawName) return res.status(400).json({ message: 'Grade name is required' });
    // Normalize: strip leading "Grade " so "Grade 10" and "10" map to the same DB record
    const name = String(rawName).replace(/^grade\s*/i, '').trim();
    const yearId = req.academic_year_id;

    const masterGrade = await (prisma as any).masterGrade.upsert({
      where: {
        name_organization_id: {
          name,
          organization_id: req.user.organization_id
        }
      },
      update: {},
      create: { name, organization_id: req.user.organization_id }
    });

    const data = await prisma.grade.create({
      data: { 
        name, 
        academic_year_id: yearId, 
        organization_id: req.user.organization_id,
        master_grade_id: masterGrade.id
      }
    });

    const admins = await prisma.user.findMany({
      where: { organization_id: req.user.organization_id, role: { name: { in: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] } } }
    });
    if (admins.length > 0) {
      await NotificationService.sendNotification({
        organization_id: req.user.organization_id,
        event_type: 'ACADEMIC_MANAGEMENT',
        entity_type: 'GRADE',
        entity_id: data.id,
        title: 'New Class Created',
        message: `Class "${name}" has been created.`,
        context_data: { icon: 'layers', color: 'notification-green' },
        recipient_ids: admins.map((a: any) => a.id)
      });
    }

    res.status(201).json({ message: 'Grade created', data });
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating Grade', error: error.message });
  }
});

gradeRouter.put('/:id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const existing = await prisma.grade.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const data = await prisma.grade.update({ where: { id: req.params.id }, data: { name: req.body.name } });
    res.json({ message: 'Grade updated', data });
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating Grade', error: error.message });
  }
});

gradeRouter.delete('/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: any, res: Response) => {
  try {
    const existing = await prisma.grade.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await prisma.$transaction(async (tx: any) => {
      // Unlink users to prevent FK constraint error before cascade
      await tx.user.updateMany({
        where: { grade_id: req.params.id, organization_id: req.user.organization_id },
        data: { grade_id: null, section_id: null }
      });

      await tx.grade.delete({ where: { id: req.params.id } });
    });

    res.json({ message: 'Grade deleted' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting Grade', error: error.message });
  }
});

router.use('/grades', gradeRouter);
// ── Section Allocation ────────────────────────────────────────────────────────
router.put('/sections/allocate', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { grade_id, allocations } = req.body;

    if (!grade_id || !Array.isArray(allocations)) {
      return res.status(400).json({ message: 'Invalid payload: grade_id and allocations array required' });
    }

    if (allocations.length === 0) {
      return res.json({ message: 'No allocations provided, nothing changed' });
    }

    // Wrap in robust transaction
    const result = await prisma.$transaction(async (tx: any) => {
      let updatedCount = 0;

      // We process sequentially inside the transaction to cleanly catch logical mismatch validation errors
      for (const al of allocations) {
        if (!al.student_id || !al.section_id) throw new Error('Missing student_id or section_id in allocation block');

        // Ensure student exists and belongs to this exact grade
        const student = await tx.user.findFirst({
          where: { id: al.student_id, organization_id: req.user.organization_id }
        });
        if (!student) throw new Error(`Student ${al.student_id} not found`);
        if (student.grade_id !== grade_id) throw new Error(`Invalid section assignment for selected grade: Student ${student.name} does not belong to grade ${grade_id}`);

        // Ensure section exists and belongs to the specified grade
        const section = await tx.section.findFirst({
          where: { id: al.section_id, organization_id: req.user.organization_id }
        });
        if (!section) throw new Error(`Section ${al.section_id} not found`);
        if (section.grade_id !== grade_id) throw new Error(`Invalid section assignment for selected grade: Section ${section.name} does not belong to grade ${grade_id}`);

        // Perform the clean assign update
        await tx.user.update({
          where: { id: student.id },
          data: { section_id: section.id }
        });
        updatedCount++;
      }

      return updatedCount;
    });

    res.json({ message: 'Section allocations saved successfully', updatedCount: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error executing bulk allocation.' });
  }
});

// Override delete for sections to unlink users first
router.delete('/sections/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: any, res: Response) => {
  try {
    const existing = await prisma.section.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await prisma.$transaction(async (tx: any) => {
      // Unlink users attached to this section (they keep their grade, lose the section)
      await tx.user.updateMany({
        where: { section_id: req.params.id, organization_id: req.user.organization_id },
        data: { section_id: null }
      });
      await tx.section.delete({ where: { id: req.params.id } });
    });

    res.json({ message: 'Section deleted' });
  } catch (error: any) {
    console.error(`Error deleting Section:`, error);
    res.status(400).json({ message: 'Error deleting Section', error: error.message });
  }
});

router.use('/sections', createCrudHandlers('Section', prisma.section));
// ── Subjects: custom handler — auto-resolves grade_id if a section_id is sent ──────────────────
const subjectRouter = Router();

subjectRouter.get('/', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: any, res: Response) => {
  try {
    const filter: any = { organization_id: req.user.organization_id };
    if (req.query.grade_id) {
      filter.grade_id = String(req.query.grade_id);
    }

    const isGlobalAdmin = req.user.permissions?.includes('ACADEMIC_STRUCTURE:READ') || req.user.permissions?.includes('ACADEMIC_STRUCTURE:VIEW');
    if (!isGlobalAdmin) {
      const visibilityFilter = await AssignmentVisibilityResolver.buildTeacherSubjectWhereClause(req);
      if (visibilityFilter.OR) {
        filter.OR = visibilityFilter.OR;
      } else if (visibilityFilter.id) {
        filter.id = visibilityFilter.id; // Fallback for no-access
      }
    }

    const data = await prisma.subject.findMany({
      where: filter,
      include: {
        subject_groups: {
          include: {
            group: {
              select: { section_id: true }
            }
          }
        }
      },
      orderBy: { sort_order: 'asc' }
    });

    const mappedData = data.map((sub: any) => {
      const { subject_groups, ...rest } = sub;
      const section_ids = subject_groups
        .filter((sg: any) => sg.group && sg.group.section_id)
        .map((sg: any) => sg.group.section_id);

      return { ...rest, section_ids: Array.from(new Set(section_ids)) };
    });

    res.json(mappedData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Subjects' });
  }
});

subjectRouter.post('/', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
  try {
    const { name, grade_id: req_grade_id } = req.body;

    if (!name || !req_grade_id) {
      return res.status(400).json({ message: 'Subject name and grade_id are required' });
    }

    let finalGradeId = req_grade_id;

    // Auto-fix: if the UI sent a section_id as grade_id, resolve the real grade_id
    const possibleSection = await prisma.section.findUnique({ where: { id: req_grade_id } });
    if (possibleSection) {
      finalGradeId = possibleSection.grade_id;
    }

    // Fetch grade name (needed for SubjectGroup naming convention)
    const gradeRecord = await prisma.grade.findUnique({ where: { id: finalGradeId }, select: { name: true, master_grade_id: true } });

    const data = await prisma.subject.upsert({
      where: {
        name_grade_id_organization_id: {
          name,
          grade_id: finalGradeId,
          organization_id: req.user.organization_id
        }
      },
      update: {},
      create: { 
        name, 
        grade_id: finalGradeId, 
        organization_id: req.user.organization_id,
        master_grade_id: gradeRecord?.master_grade_id || undefined
      }
    });

    // If section_id is explicitly provided → link ONLY to that section.
    // Otherwise → link to ALL sections under the grade (global subject).
    const requestedSectionId = req.body.section_id as string | undefined;

    const allSections = await prisma.section.findMany({
      where: { grade_id: finalGradeId, organization_id: req.user.organization_id },
      select: { id: true, name: true }
    });

    const targetSections = requestedSectionId
      ? allSections.filter((s: { id: string; name: string }) => s.id === requestedSectionId)
      : allSections;

    for (const sec of targetSections) {
      const groupName = `${gradeRecord?.name || finalGradeId} - ${sec.name} (Default)`;

      const defaultGroup = await prisma.subjectGroup.upsert({
        where: {
          name_grade_id_section_id_organization_id: {
            name: groupName,
            grade_id: finalGradeId,
            section_id: sec.id,
            organization_id: req.user.organization_id
          }
        },
        update: {},
        create: {
          name: groupName,
          grade_id: finalGradeId,
          section_id: sec.id,
          organization_id: req.user.organization_id,
          master_grade_id: gradeRecord?.master_grade_id || undefined
        }
      });

      await prisma.subjectGroupSubject.upsert({
        where: { group_id_subject_id: { group_id: defaultGroup.id, subject_id: data.id } },
        update: {},
        create: { group_id: defaultGroup.id, subject_id: data.id, subject_type: 'MANDATORY' }
      });
    }


    res.status(201).json({ message: 'Subject created', data });
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating Subject', error: error.message });
  }
});

subjectRouter.put('/:id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const existing = await prisma.subject.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const data = await prisma.subject.update({ where: { id: req.params.id }, data: { name: req.body.name } });
    res.json({ message: 'Subject updated', data });
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating Subject', error: error.message });
  }
});

subjectRouter.delete('/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: any, res: Response) => {
  try {
    const existing = await prisma.subject.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: 'Subject deleted' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting Subject', error: error.message });
  }
});

// DELETE subject from ONE section only — removes SubjectGroupSubject links for groups in that section
// The subject itself (global entity) is NOT deleted
subjectRouter.delete('/:id/section/:section_id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: any, res: Response) => {
  try {
    const { id: subjectId, section_id: sectionId } = req.params;
    const org_id = req.user.organization_id;

    // Find all SubjectGroups belonging to this section
    const groups = await prisma.subjectGroup.findMany({
      where: { section_id: sectionId, organization_id: org_id },
      select: { id: true }
    });
    const groupIds = groups.map((g: any) => g.id);

    if (groupIds.length === 0) {
      return res.json({ message: 'Subject already not linked to any group in this section', removed: 0 });
    }

    // Remove SubjectGroupSubject links for this subject in those groups
    const result = await prisma.subjectGroupSubject.deleteMany({
      where: { subject_id: subjectId, group_id: { in: groupIds } }
    });

    res.json({ message: `Subject unlinked from section`, removed: result.count });
  } catch (error: any) {
    res.status(400).json({ message: 'Error unlinking subject from section', error: error.message });
  }
});

router.use('/subjects', subjectRouter);
router.use('/syllabuses', createCrudHandlers('Syllabus', prisma.syllabus));

// ── BULK ACADEMIC STRUCTURE IMPORT (CSV/XLSX) ───────────────────────────────

router.post('/bulk/preview', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    if (!records || records.length === 0) return res.status(400).json({ message: 'Empty or invalid CSV file' });

    const org_id = req.user.organization_id;
    const session_id = randomUUID();
    const resolvedRows = [];

    // existing grades, sections, subjects
    const existingGrades = await prisma.grade.findMany({ where: { organization_id: org_id }, select: { name: true } });
    const existingSections = await prisma.section.findMany({ where: { organization_id: org_id }, select: { name: true, grade: { select: { name: true } } } });
    const existingSubjects = await prisma.subject.findMany({ where: { organization_id: org_id }, select: { name: true, grade: { select: { name: true } } } });
    const existingGroups = await prisma.subjectGroup.findMany({ 
      where: { organization_id: org_id }, 
      select: { 
        name: true, 
        grade: { select: { name: true } }, 
        section: { select: { name: true } },
        subjects: { select: { subject: { select: { name: true } } } }
      } 
    });

    const getGradeCompositeKey = (g: string) => String(g || '').trim();
    const getSectionCompositeKey = (g: string, s: string) => `${String(g || '').trim()}|${String(s || '').trim()}`;
    const getSubjectCompositeKey = (g: string, sub: string) => `${String(g || '').trim()}|${String(sub || '').trim()}`;
    const getGroupCompositeKey = (g: string, s: string, grp: string) => `${String(g || '').trim()}|${String(s || '').trim()}|${String(grp || '').trim()}`;

    const dbGrades = new Set(existingGrades.map((g: any) => getGradeCompositeKey(g.name)));
    const dbSections = new Set(existingSections.map((s: any) => getSectionCompositeKey(s.grade?.name, s.name)));
    const dbSubjects = new Set(existingSubjects.map((s: any) => getSubjectCompositeKey(s.grade?.name, s.name)));
    const dbGroups = new Set(existingGroups.map((g: any) => getGroupCompositeKey(g.grade?.name, g.section?.name, g.name)));

    const dbGroupSubjects = new Set<string>();
    existingGroups.forEach((g: any) => {
      if (g.subjects) {
        g.subjects.forEach((sg: any) => {
          if (sg.subject?.name) {
            dbGroupSubjects.add(`${getGroupCompositeKey(g.grade?.name, g.section?.name, g.name)}|${String(sg.subject.name).trim()}`);
          }
        });
      }
    });

    const seenRows = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const row: any = records[i];
      const rowNum = i + 2;

      const isEmptyRow = Object.values(row).every(val => !val || String(val).trim() === '');
      if (isEmptyRow) continue;

      const errors: string[] = [];
      let match_status = 'NOT_VALID';

      const gradeName = String(row.Grade || '').trim();
      const sectionName = String(row.Section || '').trim();
      const subjectName = String(row.Subject || '').trim();
      const subjectType = String(row['Subject Type'] || '').trim().toUpperCase();
      const groupName = String(row['Group / Stream Name'] || '').trim();

      if (!gradeName) {
        errors.push('Grade name is required');
      }

      if (subjectType && !['MANDATORY', 'OPTIONAL', 'ELECTIVE'].includes(subjectType)) {
        errors.push(`Invalid Subject Type: ${subjectType}. Must be MANDATORY, OPTIONAL, or ELECTIVE.`);
      }

      if (errors.length === 0) {
        match_status = 'VALID';
        
        const compositeKey = [gradeName, sectionName, subjectName, subjectType, groupName].join('|');
        if (seenRows.has(compositeKey)) {
          match_status = 'DUPLICATE';
        } else {
          seenRows.add(compositeKey);

          // Check DB for exact duplicate based on the most granular detail provided
          if (groupName && subjectName) {
            const key = `${getGroupCompositeKey(gradeName, sectionName, groupName)}|${subjectName}`;
            if (dbGroupSubjects.has(key)) match_status = 'DUPLICATE';
          } else if (groupName) {
            if (dbGroups.has(getGroupCompositeKey(gradeName, sectionName, groupName))) match_status = 'DUPLICATE';
          } else if (subjectName) {
            if (dbSubjects.has(getSubjectCompositeKey(gradeName, subjectName))) match_status = 'DUPLICATE';
          } else if (sectionName) {
            if (dbSections.has(getSectionCompositeKey(gradeName, sectionName))) match_status = 'DUPLICATE';
          } else if (gradeName) {
            if (dbGrades.has(getGradeCompositeKey(gradeName))) match_status = 'DUPLICATE';
          }
        }
      }

      resolvedRows.push({
        row_number: rowNum,
        raw_data: row,
        match_status,
        resolved_data: { errors }
      });
    }

    const previewData = resolvedRows.map((r) => ({
      session_id,
      organization_id: org_id,
      created_by: req.user.user_id,
      row_number: r.row_number,
      raw_data: r.raw_data,
      match_status: r.match_status,
      resolved_data: r.resolved_data
    }));

    if (previewData.length > 0) {
      await (prisma as any).previewImportData.createMany({ data: previewData });
    }

    const summary = {
      total: resolvedRows.length,
      valid: resolvedRows.filter(r => r.match_status === 'VALID').length,
      duplicate: resolvedRows.filter(r => r.match_status === 'DUPLICATE').length,
      validation_error: resolvedRows.filter(r => r.match_status === 'NOT_VALID').length,
    };

    res.status(201).json({
      message: 'Preview generated successfully',
      session_id,
      summary,
      records: resolvedRows.map(r => ({
        ...r,
        created_by_name: req.user.name || 'System',
        created_date: new Date().toISOString()
      }))
    });
  } catch (error: any) {
    console.error('[Academic Bulk Preview Error]', error);
    res.status(500).json({ message: 'Failed to process preview', error: error.message });
  }
});

router.post('/bulk/discard', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ message: 'Missing session_id' });
    
    await (prisma as any).previewImportData.deleteMany({
      where: { session_id, organization_id: req.user.organization_id, created_by: req.user.user_id }
    });

    res.json({ message: 'Preview discarded' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to discard preview', error: error.message });
  }
});

router.post('/bulk/confirm', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
  try {
    const { session_id, modified_records } = req.body;
    if (!session_id) return res.status(400).json({ message: 'Missing session_id' });

    const org_id = req.user.organization_id;
    let records: any[] = [];
    if (modified_records && Array.isArray(modified_records) && modified_records.length > 0) {
      records = modified_records;
    } else {
      const previews = await (prisma as any).previewImportData.findMany({ 
        where: { session_id, organization_id: org_id, created_by: req.user.user_id } 
      });
      if (!previews || previews.length === 0) return res.status(404).json({ message: 'Session not found or empty' });
      records = previews.map((p: any) => p.raw_data);
    }

    const academic_year_id = await getActiveAcademicYearId(org_id);
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        
        const gradeName = String(row.Grade || '').trim();
        const sectionName = String(row.Section || '').trim();
        const subjectName = String(row.Subject || '').trim();
        const subjectType = String(row['Subject Type'] || 'MANDATORY').trim().toUpperCase();
        const groupName = String(row['Group / Stream Name'] || '').trim();

        if (!gradeName) {
           results.skipped++;
           continue;
        }

        try {
          const gNameClean = gradeName.replace(/^grade\s*/i, '').trim();

          // Upsert Master Grade
          const masterGradeResult = await tx.masterGrade.upsert({
            where: { name_organization_id: { name: gNameClean, organization_id: org_id } },
            update: {},
            create: { name: gNameClean, organization_id: org_id }
          });

          // Upsert Grade
          const gradeResult = await tx.grade.upsert({
            where: { name_academic_year_id_organization_id: { name: gNameClean, academic_year_id, organization_id: org_id } },
            update: { master_grade_id: masterGradeResult.id },
            create: { name: gNameClean, academic_year_id, organization_id: org_id, master_grade_id: masterGradeResult.id }
          });

          let sectionResult = null;
          if (sectionName) {
            sectionResult = await tx.section.upsert({
              where: { name_grade_id_organization_id: { name: sectionName, grade_id: gradeResult.id, organization_id: org_id } },
              update: {},
              create: { name: sectionName, grade_id: gradeResult.id, organization_id: org_id }
            });
          }

          let subjectResult = null;
          if (subjectName) {
            subjectResult = await tx.subject.upsert({
              where: { name_grade_id_organization_id: { name: subjectName, grade_id: gradeResult.id, organization_id: org_id } },
              update: { master_grade_id: masterGradeResult.id },
              create: { name: subjectName, grade_id: gradeResult.id, organization_id: org_id, master_grade_id: masterGradeResult.id }
            });
          }

          if (groupName && sectionResult && subjectResult) {
             const groupResult = await tx.subjectGroup.upsert({
               where: {
                 name_grade_id_section_id_organization_id: {
                   name: groupName, grade_id: gradeResult.id, section_id: sectionResult.id, organization_id: org_id
                 }
               },
               update: {},
               create: { name: groupName, grade_id: gradeResult.id, section_id: sectionResult.id, organization_id: org_id, master_grade_id: masterGradeResult.id }
             });

             await tx.subjectGroupSubject.upsert({
               where: { group_id_subject_id: { group_id: groupResult.id, subject_id: subjectResult.id } },
               update: { subject_type: subjectType as any },
               create: { group_id: groupResult.id, subject_id: subjectResult.id, subject_type: subjectType as any }
             });
          } else if (!groupName && sectionResult && subjectResult) {
             const defaultGroupName = `${gradeResult.name} - ${sectionResult.name} (Default)`;
             const defaultGroup = await tx.subjectGroup.upsert({
               where: {
                 name_grade_id_section_id_organization_id: {
                   name: defaultGroupName, grade_id: gradeResult.id, section_id: sectionResult.id, organization_id: org_id
                 }
               },
               update: {},
               create: { name: defaultGroupName, grade_id: gradeResult.id, section_id: sectionResult.id, organization_id: org_id, master_grade_id: masterGradeResult.id }
             });
             
             await tx.subjectGroupSubject.upsert({
               where: { group_id_subject_id: { group_id: defaultGroup.id, subject_id: subjectResult.id } },
               update: { subject_type: subjectType as any },
               create: { group_id: defaultGroup.id, subject_id: subjectResult.id, subject_type: subjectType as any }
             });
          }

          results.created++;
        } catch (err: any) {
          results.skipped++;
          results.errors.push(`Row ${i + 2}: ${err.message || 'Unknown error'}`);
        }
      }
    }, { timeout: 30000 });

    await (prisma as any).previewImportData.deleteMany({
      where: { session_id, organization_id: org_id, created_by: req.user.user_id }
    });

    await logAuditEvent({
      organization_id: org_id,
      user_id: req.user.user_id,
      user_name: req.user.name,
      action_type: 'IMPORT',
      entity_type: 'ACADEMIC_STRUCTURE',
      entity_id: session_id,
      metadata: { success_count: results.created, skipped_count: results.skipped }
    });

    res.status(201).json({
      message: `Bulk import completed. ${results.created} rows processed, ${results.skipped} skipped.`,
      results
    });
  } catch (error: any) {
    console.error('[Academic Bulk Confirm Error]', error);
    res.status(500).json({ message: 'Bulk import failed', error: error.message });
  }
});

// ── BULK ACADEMIC STRUCTURE SETUP ────────────────────────────────────────────
// POST /api/academic/bulk-setup
// Creates grades → sections → subjects → units → topics in one transaction.
// Existing records are skipped (idempotent). Safe to run multiple times.
router.post('/bulk-setup', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;

    // ── Validate input ─────────────────────────────────────────────────────
    const { grades, sections = [], section_mapping = [], subjects = [] } = req.body;

    if (!Array.isArray(grades) || grades.length === 0)
      return res.status(400).json({ message: '`grades` must be a non-empty array of grade names' });
    if (!Array.isArray(subjects) || subjects.length === 0)
      return res.status(400).json({ message: '`subjects` must be a non-empty array' });

    // ── Resolve active academic year ──────────────────────────────────────
    const academic_year_id = await getActiveAcademicYearId(org_id);

    // ── Helper: resolve sections for a given grade name ───────────────────
    const getSectionsForGrade = (gradeName: string): string[] => {
      if (Array.isArray(section_mapping) && section_mapping.length > 0) {
        for (const group of section_mapping) {
          if (Array.isArray(group.grade_names) && group.grade_names.includes(gradeName)) {
            return Array.isArray(group.sections) ? group.sections : [];
          }
        }
      }
      return Array.isArray(sections) ? sections : [];
    };

    // ── Counters ──────────────────────────────────────────────────────────
    const summary = { grades_created: 0, grades_skipped: 0, sections_created: 0, sections_skipped: 0, subjects_created: 0, subjects_skipped: 0, units_created: 0, units_skipped: 0, topics_created: 0, topics_skipped: 0 };
    const created: any[] = [];

    // ── Run inside a transaction ──────────────────────────────────────────
    await prisma.$transaction(async (tx: any) => {
      for (const gradeName of grades) {
        // Normalize: strip leading "Grade " so "Grade 10" and "10" map to the same DB record
        const gName = String(gradeName).trim().replace(/^grade\s*/i, '').trim();
        if (!gName) continue;

        // MasterGrade
        const masterGradeResult = await tx.masterGrade.upsert({
          where: { name_organization_id: { name: gName, organization_id: org_id } },
          update: {},
          create: { name: gName, organization_id: org_id }
        });

        // Grade — has unique constraint: upsert is safe
        const gradeResult = await tx.grade.upsert({
          where: { name_academic_year_id_organization_id: { name: gName, academic_year_id, organization_id: org_id } },
          update: { master_grade_id: masterGradeResult.id },
          create: { name: gName, academic_year_id, organization_id: org_id, master_grade_id: masterGradeResult.id }
        });

        // Check if we created or skipped (upsert returns old record on update:{})
        const gradeIsNew = gradeResult.created_at &&
          (Date.now() - new Date(gradeResult.created_at).getTime()) < 5000;

        // We track differently: check if it existed before by querying after upsert
        // Simple approach: keep running count via checking pre-existence
        const gradeEntry: any = { grade_name: gName, grade_id: gradeResult.id, subjects: [] };
        created.push(gradeEntry);

        // Sections — has unique constraint: upsert is safe
        const gradeSections = getSectionsForGrade(gName);
        const sectionResults: any[] = []; // store results for SubjectGroup linking below
        for (const secName of gradeSections) {
          const sName = String(secName).trim();
          if (!sName) continue;
          const sectionResult = await tx.section.upsert({
            where: { name_grade_id_organization_id: { name: sName, grade_id: gradeResult.id, organization_id: org_id } },
            update: {},
            create: { name: sName, grade_id: gradeResult.id, organization_id: org_id }
          });
          sectionResults.push(sectionResult);
        }

        // Subjects → Units → Topics
        for (const sub of subjects) {
          const subName = String(sub.name || '').trim();
          if (!subName) continue;

          // Subject — has unique constraint: upsert is safe
          const subjectResult = await tx.subject.upsert({
            where: { name_grade_id_organization_id: { name: subName, grade_id: gradeResult.id, organization_id: org_id } },
            update: { master_grade_id: masterGradeResult.id },
            create: { name: subName, grade_id: gradeResult.id, organization_id: org_id, master_grade_id: masterGradeResult.id }
          });

          const subjectEntry: any = { name: subName, subject_id: subjectResult.id, units: [] };
          gradeEntry.subjects.push(subjectEntry);

          // ── Link subject to each section via SubjectGroup ───────────────────
          // Only runs when sections were provided in this bulk setup call
          for (const sec of sectionResults) {
            const groupName = `${gName} - ${sec.name} (Default)`;

            // Get or create the default group for this section
            const defaultGroup = await tx.subjectGroup.upsert({
              where: {
                name_grade_id_section_id_organization_id: {
                  name: groupName,
                  grade_id: gradeResult.id,
                  section_id: sec.id,
                  organization_id: org_id
                }
              },
              update: { master_grade_id: masterGradeResult.id },
              create: {
                name: groupName,
                grade_id: gradeResult.id,
                section_id: sec.id,
                organization_id: org_id,
                master_grade_id: masterGradeResult.id
              }
            });

            // Link subject to group — skip if already linked
            const existingLink = await tx.subjectGroupSubject.findFirst({
              where: { group_id: defaultGroup.id, subject_id: subjectResult.id }
            });
            if (!existingLink) {
              await tx.subjectGroupSubject.create({
                data: { group_id: defaultGroup.id, subject_id: subjectResult.id, subject_type: 'MANDATORY' }
              });
            }
          }
          // ── End SubjectGroup linking ────────────────────────────────────────

          for (const unit of (sub.units || [])) {
            const uName = String(unit.name || '').trim();
            if (!uName) continue;

            // Unit — NO unique constraint: findFirst then create
            let unitResult = await tx.unit.findFirst({
              where: { name: uName, subject_id: subjectResult.id, organization_id: org_id }
            });
            let unitIsNew = false;
            if (!unitResult) {
              unitResult = await tx.unit.create({
                data: { name: uName, subject_id: subjectResult.id, organization_id: org_id }
              });
              unitIsNew = true;
              summary.units_created++;
            } else {
              summary.units_skipped++;
            }

            const unitEntry: any = { name: uName, unit_id: unitResult.id, topics: [] };
            subjectEntry.units.push(unitEntry);

            for (const topicName of (unit.topics || [])) {
              const tName = String(topicName || '').trim();
              if (!tName) continue;

              // Topic — NO unique constraint: findFirst then create
              let topicResult = await tx.topic.findFirst({
                where: { name: tName, unit_id: unitResult.id, organization_id: org_id }
              });
              if (!topicResult) {
                topicResult = await tx.topic.create({
                  data: { name: tName, unit_id: unitResult.id, organization_id: org_id }
                });
                summary.topics_created++;
              } else {
                summary.topics_skipped++;
              }

              unitEntry.topics.push(tName);
            }
          }
        }
      }
    }, { timeout: 30000 });

    // Count grade/section/subject created vs skipped using post-transaction query
    // (upsert doesn't reliably tell us if it created or updated, so we recount)
    const summaryMsg = `Bulk setup complete. ` +
      `Grades: ${grades.length} processed. ` +
      `Units: ${summary.units_created} created, ${summary.units_skipped} skipped. ` +
      `Topics: ${summary.topics_created} created, ${summary.topics_skipped} skipped.`;

    res.status(201).json({ message: summaryMsg, summary, created });
  } catch (error: any) {
    console.error('[bulk-setup] ERROR:', error.message);
    res.status(500).json({ message: 'Bulk setup failed', error: error.message });
  }
});


// ── DIAGNOSTIC: shows exactly what units are linked to which subjects ─────────
// GET /api/academic/diagnostic  — remove once the bulk import issue is resolved
router.get('/diagnostic', async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const [grades, subjects, syllabuses, units, topics] = await Promise.all([
      prisma.grade.findMany({ where: { organization_id: org_id }, select: { id: true, name: true } }),
      prisma.subject.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } }),
      prisma.syllabus.findMany({ where: { organization_id: org_id }, select: { id: true, subject_id: true } }),
      prisma.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, subject_id: true, syllabus_id: true } }),
      prisma.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } }),
    ]);

    const syllabusMap = new Map(syllabuses.map((s: any) => [s.id, s.subject_id]));

    const enrichedUnits = units.map((u: any) => ({
      id: u.id,
      name: u.name,
      subject_id: u.subject_id,
      syllabus_id: u.syllabus_id,
      resolvedSubjectId: u.subject_id ?? (u.syllabus_id ? syllabusMap.get(u.syllabus_id) ?? null : null),
      resolvedSubjectName: (() => {
        const sid = u.subject_id ?? (u.syllabus_id ? syllabusMap.get(u.syllabus_id) : null);
        return subjects.find((s: any) => s.id === sid)?.name ?? '⚠️ UNRESOLVED';
      })()
    }));

    res.json({
      grades,
      subjects: subjects.map((s: any) => ({
        ...s,
        gradeName: grades.find((g: any) => g.id === s.grade_id)?.name ?? '?'
      })),
      units: enrichedUnits,
      topics
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.use('/units', createCrudHandlers('Unit', prisma.unit));
router.use('/topics', createCrudHandlers('Topic', prisma.topic));

// --- Stream-Based Academic Structure Support ---

// 1. Subject Groups (Streams)
router.get('/subject-groups', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const filter: any = { organization_id: org_id };
    if (req.query.grade_id) filter.grade_id = String(req.query.grade_id);
    if (req.query.section_id) filter.section_id = String(req.query.section_id);

    const groups = await prisma.subjectGroup.findMany({
      where: filter,
      include: {
        subjects: {
          include: { subject: true }
        }
      }
    });

    // Exclude internal default/placeholder groups when requested 
    // (used by student-mapping UI to prevent assigning students to technical groups)
    const excludeDefault = req.query.exclude_default === 'true';
    const filtered = excludeDefault
      ? groups.filter((g: any) => {
        const lower = g.name.toLowerCase().trim();
        return !lower.endsWith('(default)') && lower !== 'default curriculum';
      })
      : groups;

    // Map response for frontend consumption
    const mapped = filtered.map((g: any) => ({
      id: g.id,
      name: g.name,
      grade_id: g.grade_id,
      section_id: g.section_id,
      subjects: g.subjects.map((sg: any) => ({
        id: sg.subject.id,
        name: sg.subject.name,
        subject_type: sg.subject_type
      }))
    }));

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/subject-groups', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const { name, grade_id, section_id, subjects } = req.body;

    if (!name || !grade_id || !section_id) {
      return res.status(400).json({ message: 'Missing required fields: name, grade_id, section_id' });
    }

    const gradeRecord = await prisma.grade.findUnique({ where: { id: grade_id }, select: { master_grade_id: true } });

    const result = await prisma.$transaction(async (tx: any) => {
      // Create the group
      const group = await tx.subjectGroup.create({
        data: {
          organization_id: org_id,
          name,
          grade_id,
          section_id,
          master_grade_id: gradeRecord?.master_grade_id || undefined
        }
      });

      // Link subjects
      if (Array.isArray(subjects) && subjects.length > 0) {
        const payload = subjects.map((s: any) => ({
          group_id: group.id,
          subject_id: s.subject_id,
          subject_type: s.subject_type || 'MANDATORY'
        }));
        await tx.subjectGroupSubject.createMany({
          data: payload
        });
      }

      return group;
    });

    res.status(201).json(result);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'A Subject Group with this exact name already exists in this Section' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/subject-groups/:id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const org_id = req.user.organization_id;
    const { name, subjects } = req.body;

    const group = await prisma.subjectGroup.findFirst({ where: { id, organization_id: org_id } });
    if (!group) return res.status(404).json({ message: 'Subject Group not found' });

    await prisma.$transaction(async (tx: any) => {
      if (name) {
        await tx.subjectGroup.update({ where: { id }, data: { name } });
      }

      if (Array.isArray(subjects)) {
        // Clear old ones
        await (tx as any).subjectGroupSubject.deleteMany({ where: { group_id: id } });
        // Insert new ones
        if (subjects.length > 0) {
          const payload = subjects.map((s: any) => ({
            group_id: id,
            subject_id: s.subject_id,
            subject_type: s.subject_type || 'MANDATORY'
          }));
          await (tx as any).subjectGroupSubject.createMany({ data: payload });
        }
      }
    });

    res.json({ message: 'Updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/subject-groups/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const org_id = req.user.organization_id;
    const group = await prisma.subjectGroup.findFirst({ where: { id, organization_id: org_id } });
    if (!group) return res.status(404).json({ message: 'Subject Group not found' });

    await prisma.subjectGroup.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// 2. Student Group Mapping (Assigning students to stream)
router.get('/student-group-mappings', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const { grade_id, section_id } = req.query;

    let filter: any = { organization_id: org_id };

    // Filter mappings by nested relations
    if (grade_id || section_id) {
      filter.group = {};
      if (grade_id) filter.group.grade_id = String(grade_id);
      if (section_id) filter.group.section_id = String(section_id);
    }

    const mappings = await (prisma as any).studentGroupMapping.findMany({
      where: filter,
      include: {
        group: true,
        student: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    res.json(mappings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/student-group-mapping', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const { student_id, group_id } = req.body;

    if (!student_id || !group_id) {
      return res.status(400).json({ message: 'Missing student_id or group_id' });
    }

    // Validation: Enforce one group per section per student
    const targetGroup = await prisma.subjectGroup.findUnique({ where: { id: group_id } });
    if (!targetGroup) return res.status(404).json({ message: 'Subject Group not found' });

    const existingMappings = await (prisma as any).studentGroupMapping.findMany({
      where: {
        student_id,
        organization_id: org_id,
        group: {
          section_id: targetGroup.section_id
        }
      }
    });

    if (existingMappings.length > 0) {
      // Remove old mapping in the same section before creating new
      await (prisma as any).studentGroupMapping.deleteMany({
        where: {
          student_id,
          group: { section_id: targetGroup.section_id }
        }
      });
    }

    const newMapping = await (prisma as any).studentGroupMapping.create({
      data: {
        organization_id: org_id,
        student_id,
        group_id
      }
    });

    res.status(201).json(newMapping);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/student-group-mapping/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const org_id = req.user.organization_id;

    const mapping = await (prisma as any).studentGroupMapping.findFirst({ where: { id, organization_id: org_id } });
    if (!mapping) return res.status(404).json({ message: 'Mapping not found' });

    await (prisma as any).studentGroupMapping.delete({ where: { id } });
    res.json({ message: 'Mapping removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Bulk mapping endpoint — map multiple students to a stream in one request
router.post('/student-group-mapping/bulk', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const { student_ids, group_id } = req.body;

    if (!Array.isArray(student_ids) || student_ids.length === 0 || !group_id) {
      return res.status(400).json({ message: 'student_ids (non-empty array) and group_id are required' });
    }

    const targetGroup = await prisma.subjectGroup.findFirst({
      where: { id: group_id, organization_id: org_id }
    });
    if (!targetGroup) return res.status(404).json({ message: 'Subject Group not found' });

    const result = await prisma.$transaction(async (tx: any) => {
      let mapped = 0;
      let skipped = 0;

      for (const student_id of student_ids) {
        try {
          // Verify student exists in this org
          const student = await tx.user.findFirst({
            where: { id: student_id, organization_id: org_id }
          });
          if (!student) { skipped++; continue; }

          // Remove any existing mapping in the same section for this student
          await tx.studentGroupMapping.deleteMany({
            where: {
              student_id,
              organization_id: org_id,
              group: { section_id: targetGroup.section_id }
            }
          });

          // Create new mapping
          await tx.studentGroupMapping.create({
            data: {
              organization_id: org_id,
              student_id,
              group_id
            }
          });
          mapped++;
        } catch {
          skipped++;
        }
      }

      return { mapped, skipped };
    }, { timeout: 30000 });

    res.status(201).json({ message: `Bulk mapping complete: ${result.mapped} mapped, ${result.skipped} skipped`, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Bulk unmapping endpoint — remove multiple mappings in one request
router.post('/student-group-mapping/bulk-delete', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const { mapping_ids } = req.body;

    if (!Array.isArray(mapping_ids) || mapping_ids.length === 0) {
      return res.status(400).json({ message: 'mapping_ids (non-empty array) is required' });
    }

    const result = await (prisma as any).studentGroupMapping.deleteMany({
      where: {
        id: { in: mapping_ids },
        organization_id: org_id
      }
    });

    res.json({ message: `${result.count} mapping(s) removed`, removed: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
