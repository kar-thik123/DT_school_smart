import { Router, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import multer = require('multer');
import { processImage } from '../utils/image-compression.util';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
router.use(authMiddleware);

// Schema for validation
const skillSchema = z.object({
  skill_type: z.string().min(1),
  skill_name: z.string().min(1),
  academic_year_id: z.string().uuid().optional()
});

// Create a new skill
router.post('/', upload.array('images', 3), async (req: any, res: Response) => {
  try {
    const { skill_type, skill_name, academic_year_id } = skillSchema.parse(req.body);
    const userId = req.user.user_id;

    // Determine max images based on category
    let maxImages = 1;
    if (skill_type === 'Academic Skills') maxImages = 2;
    if (skill_type === 'Extra Curricular Skills') maxImages = 3;

    const files = req.files as Express.Multer.File[];
    if (files && files.length > maxImages) {
      return res.status(400).json({ error: `Maximum ${maxImages} images allowed for ${skill_type}.` });
    }

    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        // Compress and save each image
        const result = await processImage(file.buffer, file.originalname, {
          quality: 80,
          width: 800,
          format: 'webp',
          outputDirectory: 'uploads/skills'
        });
        // result.filePath is relative, e.g., 'uploads/skills/uuid.webp'
        imageUrls.push(`/${result.filePath.replace(/\\/g, '/')}`);
      }
    }

    const skill = await prisma.skill.create({
      data: {
        user_id: userId,
        organization_id: req.user.organization_id,
        academic_year_id: academic_year_id || null,
        skill_type,
        skill_name,
        images: imageUrls,
        status: 'pending'
      }
    });

    res.status(201).json(skill);
  } catch (error: any) {
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ error: error.issues || error.errors });
    }
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user skills
router.get('/all', async (req: any, res: Response) => {
  try {
    const { status, grade_id, section_id, skill_type, academic_year_id } = req.query;
    const whereClause: any = {
      organization_id: req.user.organization_id
    };
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (academic_year_id) whereClause.academic_year_id = academic_year_id;
    if (skill_type) whereClause.skill_type = skill_type;
    
    if (grade_id || section_id) {
      whereClause.user = {};
      if (grade_id) whereClause.user.grade_id = grade_id;
      if (section_id) whereClause.user.section_id = section_id;
    }

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      const assignments = await prisma.skillVerificationAssignment.findMany({
        where: { verifier_id: req.user.user_id }
      });

      if (assignments.length === 0) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const OR = assignments.map((a: any) => {
        const condition: any = { skill_type: a.skill_type };
        if (a.grade_id || a.section_id) {
          condition.user = {};
          if (a.grade_id) condition.user.grade_id = a.grade_id;
          if (a.section_id) condition.user.section_id = a.section_id;
        }
        return condition;
      });

      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({ OR });
    }

    const skills = await prisma.skill.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json(skills);
  } catch (error) {
    console.error('Error fetching all skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', async (req: any, res: Response) => {
  try {
    const userId = req.params.userId;
    // Allow users to get their own skills, or admins to view them
    if (req.user.user_id !== userId && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SCHOOL_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const skills = await prisma.skill.findMany({
      where: { user_id: userId, organization_id: req.user.organization_id },
      orderBy: { created_at: 'desc' }
    });

    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update skill status
router.patch('/:id/status', async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // pending, approved, rejected

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      const skillToUpdate = await prisma.skill.findUnique({
        where: { id },
        include: { user: true }
      });
      if (!skillToUpdate) return res.status(404).json({ error: 'Skill not found' });

      const assignment = await prisma.skillVerificationAssignment.findFirst({
        where: {
          verifier_id: req.user.user_id,
          skill_type: skillToUpdate.skill_type,
          OR: [
            { grade_id: null, section_id: null },
            { grade_id: skillToUpdate.user.grade_id ?? null, section_id: null },
            { grade_id: skillToUpdate.user.grade_id ?? null, section_id: skillToUpdate.user.section_id ?? null }
          ]
        }
      });
      if (!assignment) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: { 
        status,
        remarks: req.body.remarks || null,
        verified_by: req.user.user_id 
      }
    });

    res.json(skill);
  } catch (error) {
    console.error('Error updating skill status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing skill (details & images)
router.put('/:id', upload.array('images', 3), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { skill_type, skill_name } = skillSchema.parse(req.body);
    const userId = req.user.user_id;

    const existingSkill = await prisma.skill.findUnique({ where: { id } });
    if (!existingSkill) return res.status(404).json({ error: 'Skill not found' });
    if (existingSkill.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    let maxImages = 1;
    if (skill_type === 'Academic Skills') maxImages = 2;
    if (skill_type === 'Extra Curricular Skills') maxImages = 3;

    const files = req.files as Express.Multer.File[];
    if (files && files.length > maxImages) {
      return res.status(400).json({ error: `Maximum ${maxImages} images allowed for ${skill_type}.` });
    }

    let updatedImages = existingSkill.images;
    if (req.body.kept_images) {
      if (Array.isArray(req.body.kept_images)) {
        updatedImages = req.body.kept_images;
      } else if (req.body.kept_images === '[]') {
        updatedImages = [];
      } else {
        updatedImages = [req.body.kept_images];
      }
    }

    if (files && files.length > 0) {
      const imageUrls: string[] = [];
      for (const file of files) {
        const result = await processImage(file.buffer, file.originalname, {
          quality: 80,
          width: 800,
          format: 'webp',
          outputDirectory: 'uploads/skills'
        });
        imageUrls.push(`/${result.filePath.replace(/\\/g, '/')}`);
      }
      updatedImages = [...updatedImages, ...imageUrls];
    }

    if (updatedImages.length > maxImages) {
      return res.status(400).json({ error: `Maximum ${maxImages} images allowed for ${skill_type}.` });
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: {
        skill_type,
        skill_name,
        images: updatedImages,
        status: 'pending' // Reset to pending if edited
      }
    });

    res.json(skill);
  } catch (error: any) {
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ error: error.issues || error.errors });
    }
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete skill
router.delete('/:id', async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const skill = await prisma.skill.findUnique({ where: { id } });

    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    // Only owner or admin can delete
    if (skill.user_id !== req.user.user_id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SCHOOL_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.skill.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update status
router.patch('/bulk-status', async (req: any, res: Response) => {
  try {
    const { skill_ids, status, remarks } = req.body;

    if (!Array.isArray(skill_ids) || skill_ids.length === 0) {
      return res.status(400).json({ error: 'skill_ids array is required' });
    }

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      // Find all skills to ensure they exist and user has permission to verify
      const skillsToUpdate = await prisma.skill.findMany({
        where: { id: { in: skill_ids } },
        include: { user: true }
      });

      if (skillsToUpdate.length !== skill_ids.length) {
         return res.status(404).json({ error: 'One or more skills not found' });
      }

      // Check permissions for each skill
      for (const skill of skillsToUpdate) {
        const assignment = await prisma.skillVerificationAssignment.findFirst({
          where: {
            verifier_id: req.user.user_id,
            skill_type: skill.skill_type,
            OR: [
              { grade_id: null, section_id: null },
              { grade_id: skill.user.grade_id ?? null, section_id: null },
              { grade_id: skill.user.grade_id ?? null, section_id: skill.user.section_id ?? null }
            ]
          }
        });
        if (!assignment) {
          return res.status(403).json({ error: `Forbidden: Not assigned to verify skill ${skill.id}` });
        }
      }
    }

    await prisma.skill.updateMany({
      where: { id: { in: skill_ids } },
      data: {
        status,
        remarks: remarks || null,
        verified_by: req.user.user_id
      }
    });

    res.json({ success: true, count: skill_ids.length });
  } catch (error) {
    console.error('Error updating bulk skill status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
