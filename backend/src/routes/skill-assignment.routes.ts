import { Router, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { AuthorizationService } from '../services/authorization.service';

const router = Router();
router.use(authMiddleware);

// Schema for assignment validation
const assignmentSchema = z.object({
  verifier_id: z.string().uuid(),
  skill_type: z.string().min(1),
  grade_id: z.string().uuid().optional().nullable(),
  section_id: z.string().uuid().optional().nullable()
});

// Middleware to check permissions
router.use((req: any, res: Response, next: any) => {
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
router.post('/', async (req: any, res: Response) => {
  try {
    const hasAssignPermission = req.user.role === 'SUPER_ADMIN' || req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:ASSIGN');
    if (!hasAssignPermission) return res.status(403).json({ error: 'Forbidden' });

    const parsed = assignmentSchema.parse(req.body);

    const assignment = await prisma.skillVerificationAssignment.create({
      data: {
        organization_id: req.user.organization_id,
        verifier_id: parsed.verifier_id,
        skill_type: parsed.skill_type,
        grade_id: parsed.grade_id || null,
        section_id: parsed.section_id || null
      },
      include: {
        verifier: { select: { id: true, name: true, email: true } },
        grade: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(assignment);
  } catch (error: any) {
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
router.get('/', async (req: any, res: Response) => {
  try {
    const assignments = await prisma.skillVerificationAssignment.findMany({
      where: { organization_id: req.user.organization_id },
      include: {
        verifier: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
        grade: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an assignment
router.delete('/:id', async (req: any, res: Response) => {
  try {
    const hasDeletePermission = req.user.role === 'SUPER_ADMIN' || req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:DELETE');
    if (!hasDeletePermission) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    const assignment = await prisma.skillVerificationAssignment.findUnique({ where: { id } });

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.organization_id !== req.user.organization_id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.skillVerificationAssignment.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an assignment
router.put('/:id', async (req: any, res: Response) => {
  try {
    const hasAssignPermission = req.user.role === 'SUPER_ADMIN' || req.user.permissions?.includes('SKILLS_VERIFY_ASSIGNMENT:ASSIGN');
    if (!hasAssignPermission) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    const parsed = assignmentSchema.parse(req.body);

    const existingAssignment = await prisma.skillVerificationAssignment.findUnique({ where: { id } });
    if (!existingAssignment) return res.status(404).json({ error: 'Assignment not found' });
    if (existingAssignment.organization_id !== req.user.organization_id) return res.status(403).json({ error: 'Forbidden' });

    const assignment = await prisma.skillVerificationAssignment.update({
      where: { id },
      data: {
        verifier_id: parsed.verifier_id,
        skill_type: parsed.skill_type,
        grade_id: parsed.grade_id || null,
        section_id: parsed.section_id || null
      },
      include: {
        verifier: { select: { id: true, name: true, email: true } },
        grade: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } }
      }
    });

    res.json(assignment);
  } catch (error: any) {
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

export default router;
