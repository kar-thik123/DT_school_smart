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
  skill_name: z.string().min(1)
});

// Create a new skill
router.post('/', upload.array('images', 3), async (req: any, res: Response) => {
  try {
    const { skill_type, skill_name } = skillSchema.parse(req.body);
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
router.get('/user/:userId', async (req: any, res: Response) => {
  try {
    const userId = req.params.userId;
    // Allow users to get their own skills, or admins to view them
    if (req.user.user_id !== userId && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SCHOOL_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const skills = await prisma.skill.findMany({
      where: { user_id: userId },
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
    const { status } = req.body; // pending, approved, rejected

    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SCHOOL_ADMIN' && req.user.role !== 'TEACHER') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: { 
        status,
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

    // If new files are uploaded, replace the old ones (or you could append, but replace is standard for simple forms)
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
      updatedImages = imageUrls;
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

export default router;
