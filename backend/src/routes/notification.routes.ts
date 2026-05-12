import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

// GET all notifications for current user
router.get('/', async (req: any, res: Response) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.organization_id;

    let notifications = await prisma.notification.findMany({
      where: { userId, organization_id: orgId },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    // Cleanup orphaned notifications for deleted emails
    const emailNotifs = notifications.filter((n: any) => n.type === 'email' && n.referenceId);
    if (emailNotifs.length > 0) {
      const mailIds = emailNotifs.map((n: any) => n.referenceId as string);
      const mails = await prisma.internalMail.findMany({
        where: { id: { in: mailIds } },
        select: { id: true, deletedByReceiver: true, receiverId: true, deletedBySender: true, senderId: true }
      });
      
      const mailsToDeleteNotifsFor = mails.filter((m: any) => {
        if (m.receiverId === userId && m.deletedByReceiver) return true;
        if (m.senderId === userId && m.deletedBySender) return true;
        return false;
      }).map((m: any) => m.id);

      // Also clean up notifications where the mail doesn't exist at all anymore
      const existingMailIds = mails.map((m: any) => m.id);
      const nonExistentMailIds = mailIds.filter((id: string) => !existingMailIds.includes(id));
      const allIdsToDelete = [...mailsToDeleteNotifsFor, ...nonExistentMailIds];

      if (allIdsToDelete.length > 0) {
        await prisma.notification.deleteMany({
          where: { referenceId: { in: allIdsToDelete }, userId }
        });
        notifications = notifications.filter((n: any) => n.referenceId && !allIdsToDelete.includes(n.referenceId));
      }
    }

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// GET unread count
router.get('/unread-count', async (req: any, res: Response) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.organization_id;

    const count = await prisma.notification.count({
      where: { userId, organization_id: orgId, isRead: false }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

// PATCH mark single notification as read
router.patch('/:id/read', async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ message: 'Notification marked as read', notification: updated });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// PATCH mark all notifications as read
router.patch('/read-all', async (req: any, res: Response) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.organization_id;

    await prisma.notification.updateMany({
      where: { userId, organization_id: orgId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

// DELETE single notification
router.delete('/:id', async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notification.delete({ where: { id } });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

export default router;
