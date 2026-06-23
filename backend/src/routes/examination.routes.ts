import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { AuthorizationService } from '../services/authorization.service';
import { AcademicContextResolver } from '../utils/academic-context.resolver';

const router = Router();

router.use(authMiddleware);

const examinationSchema = z.object({
  exam_name: z.string().min(2)
});

/**
 * GET /api/examinations
 * List all examinations for the current organization
 */
router.get('/', async (req: any, res: Response) => {
  try {
    const userPermissions = req.user?.permissions || [];
    if (!AuthorizationService.hasPermission(userPermissions, 'EXAMINATION', 'VIEW') &&
        !AuthorizationService.hasPermission(userPermissions, 'EXAMINATION', 'MANAGE')) {
      return res.status(403).json({ message: 'Forbidden: Requires EXAMINATION:VIEW or EXAMINATION:MANAGE' });
    }

    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);

    const examinations = await prisma.examination.findMany({
      where: {
        organization_id: req.user.organization_id,
        academic_year_id
      },
      include: {
        academic_year: true,
        creator: { select: { id: true, name: true, email: true } },
        modifier: { select: { id: true, name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(examinations);
  } catch (error) {
    console.error('[ExaminationRoutes] GET / error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/examinations/:id
 * Get a specific examination
 */
router.get('/:id', async (req: any, res: Response) => {
  try {
    const userPermissions = req.user?.permissions || [];
    if (!AuthorizationService.hasPermission(userPermissions, 'EXAMINATION', 'VIEW') &&
        !AuthorizationService.hasPermission(userPermissions, 'EXAMINATION', 'MANAGE')) {
      return res.status(403).json({ message: 'Forbidden: Requires EXAMINATION:VIEW or EXAMINATION:MANAGE' });
    }

    const examination = await prisma.examination.findUnique({
      where: { id: req.params.id },
      include: {
        academic_year: true,
        creator: { select: { id: true, name: true, email: true } },
        modifier: { select: { id: true, name: true, email: true } }
      }
    });

    if (!examination) return res.status(404).json({ message: 'Examination not found' });
    if (examination.organization_id !== req.user.organization_id) return res.status(403).json({ message: 'Forbidden' });

    res.json(examination);
  } catch (error) {
    console.error('[ExaminationRoutes] GET /:id error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/examinations
 * Create a new examination
 */
router.post('/', requirePermission('EXAMINATION', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const parsed = examinationSchema.parse(req.body);
    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);

    const existing = await prisma.examination.findFirst({
      where: {
        exam_name: parsed.exam_name,
        organization_id: req.user.organization_id,
        academic_year_id: academic_year_id
      }
    });
    if (existing) return res.status(400).json({ message: 'An examination with this name already exists in the selected academic year' });

    const examination = await prisma.examination.create({
      data: {
        exam_name: parsed.exam_name,
        organization_id: req.user.organization_id,
        academic_year_id: academic_year_id,
        created_by: req.user.user_id
      }
    });
    res.status(201).json(examination);
  } catch (error: any) {
    console.error('[ExaminationRoutes] POST / error', error);
    res.status(400).json({ message: error.message || 'Bad request' });
  }
});

/**
 * PUT /api/examinations/:id
 * Update an existing examination
 */
router.put('/:id', requirePermission('EXAMINATION', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const parsed = examinationSchema.parse(req.body);
    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);
    const examination = await prisma.examination.findUnique({ where: { id: req.params.id } });

    if (!examination) return res.status(404).json({ message: 'Examination not found' });
    if (examination.organization_id !== req.user.organization_id) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.examination.update({
      where: { id: req.params.id },
      data: {
        exam_name: parsed.exam_name,
        academic_year_id: academic_year_id,
        modified_by: req.user.user_id
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('[ExaminationRoutes] PUT /:id error', error);
    res.status(400).json({ message: error.message || 'Bad request' });
  }
});

/**
 * DELETE /api/examinations/:id
 * Delete an examination
 */
router.delete('/:id', requirePermission('EXAMINATION', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const examination = await prisma.examination.findUnique({ where: { id: req.params.id } });

    if (!examination) return res.status(404).json({ message: 'Examination not found' });
    if (examination.organization_id !== req.user.organization_id) return res.status(403).json({ message: 'Forbidden' });

    await prisma.examination.delete({ where: { id: req.params.id } });
    res.json({ message: 'Examination deleted successfully' });
  } catch (error) {
    console.error('[ExaminationRoutes] DELETE /:id error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
