import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { logAuditEvent } from '../services/audit.service';
import { AcademicContextResolver } from '../utils/academic-context.resolver';

const router = Router();
router.use(authMiddleware);

const assignmentSchema = z.object({
  teacher_id: z.string().uuid(),
  assignment_type: z.enum(['CLASS_TEACHER', 'SUBJECT_TEACHER']),
  grade_id: z.string().uuid(),
  section_id: z.string().uuid().optional().nullable(),
  subject_id: z.string().uuid().optional().nullable()
});

// Read all assignments
router.get('/', requirePermission('TEACHER_ASSIGNMENT', 'VIEW'), async (req: any, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const yearId = await AcademicContextResolver.resolveAcademicYearId(req);
    const assignments = await prisma.teacherAssignment.findMany({
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
    assignment_type: z.enum(['CLASS_TEACHER', 'SUBJECT_TEACHER']),
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
          subject_id: a.assignment_type === 'CLASS_TEACHER' ? null : a.subject_id,
          teacher_id: parsed.teacher_id,
          academic_year_id: req.academic_year_id,
          organization_id: req.user.organization_id
        };
      });

      // Validation
      for (const a of dataToInsert) {
        if (a.assignment_type === 'CLASS_TEACHER' && a.section_id) {
          const existing = await prisma.teacherAssignment.findFirst({
            where: { organization_id: a.organization_id, academic_year_id: a.academic_year_id, section_id: a.section_id, assignment_type: 'CLASS_TEACHER' }
          });
          if (existing && existing.teacher_id !== a.teacher_id) throw new Error(`Section already has a Class Teacher assigned for this academic year`);
        }
        if (a.assignment_type === 'SUBJECT_TEACHER' && a.section_id && a.subject_id) {
          const existing = await prisma.teacherAssignment.findFirst({
            where: { organization_id: a.organization_id, academic_year_id: a.academic_year_id, section_id: a.section_id, subject_id: a.subject_id, assignment_type: 'SUBJECT_TEACHER' }
          });
          if (existing && existing.teacher_id !== a.teacher_id) throw new Error(`This subject is already assigned to a teacher in this section for this academic year`);
        }
      }

      const assignmentProcess = await prisma.teacherAssignment.createMany({
        data: dataToInsert,
        skipDuplicates: true
      });

      await logAuditEvent({
        organization_id: req.user.organization_id,
        user_id: req.user.user_id,
        user_name: req.user.name,
        action_type: 'ASSIGN',
        entity_type: 'TEACHER_ASSIGNMENT',
        entity_id: parsed.teacher_id,
        metadata: { batch: true, count: assignmentProcess.count }
      });

      return res.status(201).json({ message: 'Teacher assignments created', count: assignmentProcess.count });
    } else {
      const parsed = assignmentSchema.parse(req.body);

      if (parsed.assignment_type === 'SUBJECT_TEACHER' && !parsed.subject_id) {
        return res.status(400).json({ message: 'subject_id is required for SUBJECT_TEACHER assignment' });
      }
      if (parsed.assignment_type === 'CLASS_TEACHER') {
        parsed.subject_id = null;
      }

      if (parsed.assignment_type === 'CLASS_TEACHER' && parsed.section_id) {
        const existing = await prisma.teacherAssignment.findFirst({
          where: { organization_id: req.user.organization_id, academic_year_id: req.academic_year_id, section_id: parsed.section_id, assignment_type: 'CLASS_TEACHER' }
        });
        if (existing && existing.teacher_id !== parsed.teacher_id) return res.status(400).json({ message: `Section already has a Class Teacher assigned for this academic year` });
      }

      if (parsed.assignment_type === 'SUBJECT_TEACHER' && parsed.section_id && parsed.subject_id) {
        const existing = await prisma.teacherAssignment.findFirst({
          where: { organization_id: req.user.organization_id, academic_year_id: req.academic_year_id, section_id: parsed.section_id, subject_id: parsed.subject_id, assignment_type: 'SUBJECT_TEACHER' }
        });
        if (existing && existing.teacher_id !== parsed.teacher_id) return res.status(400).json({ message: `This subject is already assigned to a teacher in this section for this academic year` });
      }

      const assignment = await prisma.teacherAssignment.create({
        data: {
          ...parsed,
          academic_year_id: req.academic_year_id,
          organization_id: req.user.organization_id
        }
      });

      await logAuditEvent({
        organization_id: req.user.organization_id,
        user_id: req.user.user_id,
        user_name: req.user.name,
        action_type: 'ASSIGN',
        entity_type: 'TEACHER_ASSIGNMENT',
        entity_id: assignment.id,
        metadata: { teacher_id: assignment.teacher_id, assignment_type: assignment.assignment_type }
      });

      return res.status(201).json({ message: 'Teacher assignment created', assignment });
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Duplicate assignment detected for this teacher in the specified scope' });
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
    if (parsed.assignment_type === 'CLASS_TEACHER') {
      parsed.subject_id = null;
    }

    if (parsed.assignment_type === 'CLASS_TEACHER' && parsed.section_id) {
      const exist = await prisma.teacherAssignment.findFirst({
        where: { organization_id: req.user.organization_id, academic_year_id: req.academic_year_id, section_id: parsed.section_id, assignment_type: 'CLASS_TEACHER', id: { not: req.params.id } }
      });
      if (exist && exist.teacher_id !== parsed.teacher_id) return res.status(400).json({ message: `Section already has a Class Teacher assigned` });
    }

    if (parsed.assignment_type === 'SUBJECT_TEACHER' && parsed.section_id && parsed.subject_id) {
      const exist = await prisma.teacherAssignment.findFirst({
        where: { organization_id: req.user.organization_id, academic_year_id: req.academic_year_id, section_id: parsed.section_id, subject_id: parsed.subject_id, assignment_type: 'SUBJECT_TEACHER', id: { not: req.params.id } }
      });
      if (exist && exist.teacher_id !== parsed.teacher_id) return res.status(400).json({ message: `This subject is already assigned to a teacher in this section` });
    }

    const assignment = await prisma.teacherAssignment.update({
      where: { id: req.params.id },
      data: {
        ...parsed,
        academic_year_id: req.academic_year_id
      }
    });

    await logAuditEvent({
      organization_id: req.user.organization_id,
      user_id: req.user.user_id,
      user_name: req.user.name,
      action_type: 'UPDATE',
      entity_type: 'TEACHER_ASSIGNMENT',
      entity_id: assignment.id,
      metadata: { teacher_id: assignment.teacher_id, assignment_type: assignment.assignment_type }
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

    await logAuditEvent({
      organization_id: req.user.organization_id,
      user_id: req.user.user_id,
      user_name: req.user.name,
      action_type: 'DELETE',
      entity_type: 'TEACHER_ASSIGNMENT',
      entity_id: existing.id,
      metadata: { teacher_id: existing.teacher_id, assignment_type: existing.assignment_type }
    });

    res.json({ message: 'Teacher assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting assignment' });
  }
});

export default router;
