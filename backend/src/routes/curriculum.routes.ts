import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission, AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();

const createUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required').max(255),
  grade_id: z.string().uuid('Invalid grade_id'),
  section_id: z.string().uuid('Invalid section_id').or(z.literal('ALL')),
  subject_id: z.string().uuid('Invalid subject_id'),
  order_index: z.number().int().min(0).optional(),
});

const updateUnitSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  order_index: z.number().int().min(0).optional(),
});

const createTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required').max(255),
  unit_id: z.string().uuid('Invalid unit_id'),
  order_index: z.number().int().min(0).optional(),
});

const updateTopicSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  order_index: z.number().int().min(0).optional(),
});

const createSubTopicSchema = z.object({
  name: z.string().min(1, 'Sub topic name is required').max(255),
  topic_id: z.string().uuid('Invalid topic_id'),
  order_index: z.number().int().min(0).optional(),
});

const updateSubTopicSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  order_index: z.number().int().min(0).optional(),
});

// ─── Shared helpers ─────────────────────────────────────────────────────────

function parsePagination(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function parseSearch(query: any): string | undefined {
  return query.search ? String(query.search).trim() : undefined;
}

function parseSortField(query: any, allowed: string[], defaultField: string): { field: string; order: 'asc' | 'desc' } {
  const field = allowed.includes(query.sort_by) ? query.sort_by : defaultField;
  const order = query.sort_order === 'desc' ? 'desc' : 'asc';
  return { field, order };
}

// ═══════════════════════════════════════════════════════════════════════════
//  UNITS CRUD
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/curriculum/units
router.post('/units', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createUnitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const org_id = req.user!.organization_id;
    const { name, grade_id, section_id, subject_id, order_index } = parsed.data;

    // Verify grade, section, subject belong to org
    const [grade, subject] = await Promise.all([
      prisma.grade.findFirst({ where: { id: grade_id, organization_id: org_id } }),
      prisma.subject.findFirst({ where: { id: subject_id, organization_id: org_id } }),
    ]);

    if (!grade) return res.status(404).json({ message: 'Grade not found in your organization' });
    if (!subject) return res.status(404).json({ message: 'Subject not found in your organization' });

    let dbSectionId: string | null = null;
    if (section_id !== 'ALL') {
      const section = await prisma.section.findFirst({ where: { id: section_id, organization_id: org_id } });
      if (!section) return res.status(404).json({ message: 'Section not found in your organization' });
      dbSectionId = section_id;
    }

    // Auto-calculate order_index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const maxOrder = await prisma.unit.aggregate({
        where: { organization_id: org_id, grade_id, section_id: dbSectionId, subject_id },
        _max: { order_index: true },
      });
      finalOrderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    const unit = await prisma.unit.create({
      data: {
        name,
        grade_id,
        section_id: dbSectionId,
        subject_id,
        organization_id: org_id,
        order_index: finalOrderIndex,
      },
      include: {
        grade: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: 'Unit created successfully', data: unit });
  } catch (error: any) {
    console.error('[curriculum/units] CREATE error:', error.message);
    res.status(500).json({ message: 'Failed to create unit', error: error.message });
  }
});

// GET /api/curriculum/units
router.get('/units', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const { page, limit, skip } = parsePagination(req.query);
    const search = parseSearch(req.query);
    const sort = parseSortField(req.query, ['name', 'order_index', 'created_at'], 'order_index');

    const where: any = { organization_id: org_id };
    const andConditions: any[] = [];

    // Filters
    if (req.query.grade_id) where.grade_id = String(req.query.grade_id);
    if (req.query.subject_id) where.subject_id = String(req.query.subject_id);

    if (req.query.section_id) {
      andConditions.push({
        OR: [
          { section_id: String(req.query.section_id) },
          { section_id: null }
        ]
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [data, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        include: {
          grade: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
          _count: { select: { topics: true } },
        },
        orderBy: { [sort.field]: sort.order },
        skip,
        take: limit,
      }),
      prisma.unit.count({ where }),
    ]);

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[curriculum/units] GET error:', error.message);
    res.status(500).json({ message: 'Failed to fetch units', error: error.message });
  }
});

// GET /api/curriculum/units/:id
router.get('/units/:id', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const unit = await prisma.unit.findFirst({
      where: { id: req.params.id, organization_id: org_id },
      include: {
        grade: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        topics: { orderBy: { order_index: 'asc' }, include: { _count: { select: { sub_topics: true } } } },
      },
    });
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch unit', error: error.message });
  }
});

// PATCH /api/curriculum/units/:id
router.patch('/units/:id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const existing = await prisma.unit.findFirst({ where: { id: req.params.id, organization_id: org_id } });
    if (!existing) return res.status(404).json({ message: 'Unit not found' });

    const parsed = updateUnitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const unit = await prisma.unit.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: {
        grade: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    });
    res.json({ message: 'Unit updated successfully', data: unit });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update unit', error: error.message });
  }
});

// DELETE /api/curriculum/units/:id
router.delete('/units/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const existing = await prisma.unit.findFirst({ where: { id: req.params.id, organization_id: org_id } });
    if (!existing) return res.status(404).json({ message: 'Unit not found' });

    await prisma.unit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Unit deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete unit', error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  TOPICS CRUD
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/curriculum/topics
router.post('/topics', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const org_id = req.user!.organization_id;
    const { name, unit_id, order_index } = parsed.data;

    const unit = await prisma.unit.findFirst({ where: { id: unit_id, organization_id: org_id } });
    if (!unit) return res.status(404).json({ message: 'Unit not found in your organization' });

    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const maxOrder = await prisma.topic.aggregate({
        where: { organization_id: org_id, unit_id },
        _max: { order_index: true },
      });
      finalOrderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        unit_id,
        organization_id: org_id,
        order_index: finalOrderIndex,
      },
      include: {
        unit: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: 'Topic created successfully', data: topic });
  } catch (error: any) {
    console.error('[curriculum/topics] CREATE error:', error.message);
    res.status(500).json({ message: 'Failed to create topic', error: error.message });
  }
});

// GET /api/curriculum/topics
router.get('/topics', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const { page, limit, skip } = parsePagination(req.query);
    const search = parseSearch(req.query);
    const sort = parseSortField(req.query, ['name', 'order_index', 'created_at'], 'order_index');

    const where: any = { organization_id: org_id };
    if (req.query.unit_id) {
      const ids = String(req.query.unit_id).split(',');
      where.unit_id = ids.length > 1 ? { in: ids } : ids[0];
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        include: {
          unit: { select: { id: true, name: true } },
          _count: { select: { sub_topics: true } },
        },
        orderBy: { [sort.field]: sort.order },
        skip,
        take: limit,
      }),
      prisma.topic.count({ where }),
    ]);

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[curriculum/topics] GET error:', error.message);
    res.status(500).json({ message: 'Failed to fetch topics', error: error.message });
  }
});

// GET /api/curriculum/topics/:id
router.get('/topics/:id', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const topic = await prisma.topic.findFirst({
      where: { id: req.params.id, organization_id: org_id },
      include: {
        unit: { select: { id: true, name: true } },
        sub_topics: { orderBy: { order_index: 'asc' } },
      },
    });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch topic', error: error.message });
  }
});

// PATCH /api/curriculum/topics/:id
router.patch('/topics/:id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const existing = await prisma.topic.findFirst({ where: { id: req.params.id, organization_id: org_id } });
    if (!existing) return res.status(404).json({ message: 'Topic not found' });

    const parsed = updateTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const topic = await prisma.topic.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { unit: { select: { id: true, name: true } } },
    });
    res.json({ message: 'Topic updated successfully', data: topic });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update topic', error: error.message });
  }
});

// DELETE /api/curriculum/topics/:id
router.delete('/topics/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const existing = await prisma.topic.findFirst({ where: { id: req.params.id, organization_id: org_id } });
    if (!existing) return res.status(404).json({ message: 'Topic not found' });

    await prisma.topic.delete({ where: { id: req.params.id } });
    res.json({ message: 'Topic deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete topic', error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUBTOPICS CRUD
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/curriculum/subtopics
router.post('/subtopics', requirePermission('ACADEMIC_STRUCTURE', 'CREATE'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createSubTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const org_id = req.user!.organization_id;
    const { name, topic_id, order_index } = parsed.data;

    const topic = await prisma.topic.findFirst({ where: { id: topic_id, organization_id: org_id } });
    if (!topic) return res.status(404).json({ message: 'Topic not found in your organization' });

    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const maxOrder = await prisma.subTopic.aggregate({
        where: { organization_id: org_id, topic_id },
        _max: { order_index: true },
      });
      finalOrderIndex = (maxOrder._max.order_index ?? -1) + 1;
    }

    const subTopic = await prisma.subTopic.create({
      data: {
        name,
        topic_id,
        organization_id: org_id,
        order_index: finalOrderIndex,
      },
      include: {
        topic: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: 'Sub topic created successfully', data: subTopic });
  } catch (error: any) {
    console.error('[curriculum/subtopics] CREATE error:', error.message);
    res.status(500).json({ message: 'Failed to create sub topic', error: error.message });
  }
});

// GET /api/curriculum/subtopics
router.get('/subtopics', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const { page, limit, skip } = parsePagination(req.query);
    const search = parseSearch(req.query);
    const sort = parseSortField(req.query, ['name', 'order_index', 'created_at'], 'order_index');

    const where: any = { organization_id: org_id };
    if (req.query.topic_id) {
      const ids = String(req.query.topic_id).split(',');
      where.topic_id = ids.length > 1 ? { in: ids } : ids[0];
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.subTopic.findMany({
        where,
        include: {
          topic: { select: { id: true, name: true } },
        },
        orderBy: { [sort.field]: sort.order },
        skip,
        take: limit,
      }),
      prisma.subTopic.count({ where }),
    ]);

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[curriculum/subtopics] GET error:', error.message);
    res.status(500).json({ message: 'Failed to fetch sub topics', error: error.message });
  }
});

// GET /api/curriculum/subtopics/:id
router.get('/subtopics/:id', requirePermission('ACADEMIC_STRUCTURE', 'READ'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const subTopic = await prisma.subTopic.findFirst({
      where: { id: req.params.id, organization_id: org_id },
      include: { topic: { select: { id: true, name: true } } },
    });
    if (!subTopic) return res.status(404).json({ message: 'Sub topic not found' });
    res.json(subTopic);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch sub topic', error: error.message });
  }
});

// PATCH /api/curriculum/subtopics/:id
router.patch('/subtopics/:id', requirePermission('ACADEMIC_STRUCTURE', 'EDIT'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const existing = await prisma.subTopic.findFirst({ where: { id: req.params.id, organization_id: org_id } });
    if (!existing) return res.status(404).json({ message: 'Sub topic not found' });

    const parsed = updateSubTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const subTopic = await prisma.subTopic.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { topic: { select: { id: true, name: true } } },
    });
    res.json({ message: 'Sub topic updated successfully', data: subTopic });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update sub topic', error: error.message });
  }
});

// DELETE /api/curriculum/subtopics/:id
router.delete('/subtopics/:id', requirePermission('ACADEMIC_STRUCTURE', 'DELETE'), async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user!.organization_id;
    const existing = await prisma.subTopic.findFirst({ where: { id: req.params.id, organization_id: org_id } });
    if (!existing) return res.status(404).json({ message: 'Sub topic not found' });

    await prisma.subTopic.delete({ where: { id: req.params.id } });
    res.json({ message: 'Sub topic deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete sub topic', error: error.message });
  }
});

export default router;
