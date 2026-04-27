import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

const assignmentSchema = z.object({
  teacher_id: z.string().uuid(),
  assignment_type: z.enum(['CLASS_INCHARGE', 'SUBJECT_TEACHER']),
  grade_id: z.string().uuid(),
  section_id: z.string().uuid().optional().nullable(),
  subject_id: z.string().uuid().optional().nullable()
});

// Read all assignments
router.get('/', requirePermission('TEACHER_ASSIGNMENT', 'READ'), async (req: any, res: Response) => {
  try {
    const assignments = await prisma.teacherAssignment.findMany({
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
      assignments.forEach((a: any) => {
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
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments' });
  }
});

const batchAssignmentSchema = z.object({
  teacher_id: z.string().uuid(),
  assignments: z.array(z.object({
    assignment_type: z.enum(['CLASS_INCHARGE', 'SUBJECT_TEACHER']),
    grade_id: z.string().uuid(),
    section_id: z.string().uuid().optional().nullable(),
    subject_id: z.string().uuid().optional().nullable()
  })).min(1)
});

// Create assignment(s)
router.post('/', requirePermission('TEACHER_ASSIGNMENT', 'CREATE'), async (req: any, res: Response) => {
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
          subject_id: a.assignment_type === 'CLASS_INCHARGE' ? null : a.subject_id,
          teacher_id: parsed.teacher_id,
          organization_id: req.user.organization_id
        };
      });

      const assignmentProcess = await prisma.teacherAssignment.createMany({
        data: dataToInsert,
        skipDuplicates: true
      });

      return res.status(201).json({ message: 'Teacher assignments created', count: assignmentProcess.count });
    } else {
      const parsed = assignmentSchema.parse(req.body);

      if (parsed.assignment_type === 'SUBJECT_TEACHER' && !parsed.subject_id) {
        return res.status(400).json({ message: 'subject_id is required for SUBJECT_TEACHER assignment' });
      }
      if (parsed.assignment_type === 'CLASS_INCHARGE') {
        parsed.subject_id = null;
      }

      const assignment = await prisma.teacherAssignment.create({
        data: {
          ...parsed,
          organization_id: req.user.organization_id
        }
      });

      return res.status(201).json({ message: 'Teacher assignment created', assignment });
    }
  } catch (error: any) {
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
router.put('/:id', requirePermission('TEACHER_ASSIGNMENT', 'EDIT'), async (req: any, res: Response) => {
  try {
    const existing = await prisma.teacherAssignment.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    if (!existing) return res.status(404).json({ message: 'Assignment not found' });

    const parsed = assignmentSchema.parse(req.body);

    // Validation Rules
    if (parsed.assignment_type === 'SUBJECT_TEACHER' && !parsed.subject_id) {
      return res.status(400).json({ message: 'subject_id is required for SUBJECT_TEACHER assignment' });
    }
    if (parsed.assignment_type === 'CLASS_INCHARGE') {
      parsed.subject_id = null;
    }

    const assignment = await prisma.teacherAssignment.update({
      where: { id: existing.id },
      data: parsed
    });

    res.json({ message: 'Teacher assignment updated', assignment });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Duplicate assignment detected' });
    }
    res.status(400).json({ message: 'Error updating assignment', error: error.message });
  }
});

// Delete assignment
router.delete('/:id', requirePermission('TEACHER_ASSIGNMENT', 'DELETE'), async (req: any, res: Response) => {
  try {
    const existing = await prisma.teacherAssignment.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    if (!existing) return res.status(404).json({ message: 'Assignment not found' });

    await prisma.teacherAssignment.delete({ where: { id: existing.id } });
    res.json({ message: 'Teacher assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting assignment' });
  }
});

export default router;
