import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/mails';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();
router.use(authMiddleware);

// GET users in the same organization for Compose autocomplete
router.get('/users/search', async (req: any, res: Response) => {
  try {
    const { q } = req.query;
    const orgId = req.user.organization_id;

    if (!q || typeof q !== 'string') {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        organization_id: orgId,
        is_active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true, role: { select: { name: true } } },
      take: 10
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users' });
  }
});

// GET mails by folder
router.get('/folder/:folder', async (req: any, res: Response) => {
  try {
    const { folder } = req.params;
    const userId = req.user.user_id;
    const orgId = req.user.organization_id;

    let whereClause: any = { organization_id: orgId };

    if (folder === 'inbox') {
      whereClause = { ...whereClause, receiverId: userId, status: 'SENT', deletedByReceiver: false, isArchived: false };
    } else if (folder === 'starred') {
      whereClause = {
        ...whereClause,
        OR: [
          { receiverId: userId, isStarred: true, deletedByReceiver: false },
          { senderId: userId, isStarred: true, deletedBySender: false }
        ]
      };
    } else if (folder === 'sent') {
      whereClause = { ...whereClause, senderId: userId, status: 'SENT', deletedBySender: false };
    } else if (folder === 'drafts') {
      whereClause = { ...whereClause, senderId: userId, status: 'DRAFT', deletedBySender: false };
    } else if (folder === 'trash') {
      whereClause = {
        ...whereClause,
        OR: [
          { receiverId: userId, deletedByReceiver: true },
          { senderId: userId, deletedBySender: true }
        ]
      };
    } else {
      return res.status(400).json({ message: 'Invalid folder' });
    }

    const mails = await prisma.internalMail.findMany({
      where: whereClause,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
        attachments: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(mails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mails' });
  }
});

// POST send or draft mail
router.post('/send', upload.array('attachments'), async (req: any, res: Response) => {
  try {
    console.log('--- Send Mail Request ---');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const { receiverId, subject, body, status, replyToId } = req.body;
    const senderId = req.user.user_id;
    const orgId = req.user.organization_id;

    if (!receiverId || !subject) {
      return res.status(400).json({ message: 'Receiver and Subject are required' });
    }

    // Ensure receiver belongs to the same org
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver || receiver.organization_id !== orgId) {
      return res.status(403).json({ message: 'Receiver not found in your organization' });
    }

    const mail = await prisma.internalMail.create({
      data: {
        organization_id: orgId,
        senderId,
        receiverId,
        subject,
        body: body || '',
        status: status === 'DRAFT' ? 'DRAFT' : 'SENT',
        ...(replyToId && replyToId !== 'null' ? { replyToId } : {}),
      }
    });

    // Handle attachments if any
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const attachmentData = files.map(file => ({
        mailId: mail.id,
        filename: file.originalname,
        url: `/uploads/mails/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      }));

      await prisma.internalMailAttachment.createMany({
        data: attachmentData
      });
    }

    const mailWithAttachments = await prisma.internalMail.findUnique({
      where: { id: mail.id },
      include: { attachments: true }
    });

    res.status(201).json({ message: `Mail ${status === 'DRAFT' ? 'saved to drafts' : 'sent'} successfully`, mail: mailWithAttachments });
  } catch (error) {
    res.status(500).json({ message: 'Error sending mail' });
  }
});

// PATCH update mail actions (read/delete)
router.patch('/:id/action', async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { action, value } = req.body; // action: 'read', 'delete', 'restore'
    const userId = req.user.user_id;
    const orgId = req.user.organization_id;

    const mail = await prisma.internalMail.findUnique({ where: { id } });

    if (!mail || mail.organization_id !== orgId) {
      return res.status(404).json({ message: 'Mail not found' });
    }

    let updateData: any = {};

    // Star and archive can be toggled by either sender or receiver
    if (action === 'star') {
      if (mail.receiverId !== userId && mail.senderId !== userId) {
        return res.status(403).json({ message: 'Unauthorized action on this mail' });
      }
      updateData.isStarred = value !== undefined ? value : !mail.isStarred;
    } else if (action === 'archive') {
      if (mail.receiverId !== userId && mail.senderId !== userId) {
        return res.status(403).json({ message: 'Unauthorized action on this mail' });
      }
      updateData.isArchived = true;
    } else if (mail.receiverId === userId) {
      if (action === 'read') updateData.isRead = value;
      if (action === 'delete') updateData.deletedByReceiver = true;
      if (action === 'restore') updateData.deletedByReceiver = false;
    } else if (mail.senderId === userId) {
      if (action === 'delete') updateData.deletedBySender = true;
      if (action === 'restore') updateData.deletedBySender = false;
    } else {
      return res.status(403).json({ message: 'Unauthorized action on this mail' });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const updatedMail = await prisma.internalMail.update({
      where: { id },
      data: updateData
    });

    res.json({ message: 'Mail updated successfully', mail: updatedMail });
  } catch (error) {
    res.status(500).json({ message: 'Error updating mail' });
  }
});

export default router;
