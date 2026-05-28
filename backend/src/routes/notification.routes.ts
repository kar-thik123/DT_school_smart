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

    const recipients = await prisma.notificationRecipient.findMany({
      where: { 
        user_id: userId,
        notification: { organization_id: orgId }
      },
      include: {
        notification: true
      },
      orderBy: { notification: { created_at: 'desc' } },
      take: 50
    });

    // Flatten to match old response format for UI compatibility
    const notifications = recipients.map((r: any) => ({
      ...r.notification,
      id: r.id, // using recipient id as the identifier for marking read
      notification_id: r.notification_id,
      isRead: r.is_read,
      userId: r.user_id,
      referenceId: r.notification.entity_id,
      type: r.notification.event_type === 'INTERNAL_MAIL' ? 'email' : r.notification.event_type,
      icon: (r.notification.context_data as any)?.icon || 'bell',
      color: (r.notification.context_data as any)?.color || 'text-primary'
    }));

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

    const count = await prisma.notificationRecipient.count({
      where: { 
        user_id: userId, 
        is_read: false,
        notification: { organization_id: orgId }
      }
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

    const recipient = await prisma.notificationRecipient.findUnique({ where: { id } });
    if (!recipient || recipient.user_id !== userId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notificationRecipient.update({
      where: { id },
      data: { is_read: true, read_at: new Date() }
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

    await prisma.notificationRecipient.updateMany({
      where: { 
        user_id: userId, 
        is_read: false,
        notification: { organization_id: orgId }
      },
      data: { is_read: true, read_at: new Date() }
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

    const recipient = await prisma.notificationRecipient.findUnique({ where: { id } });
    if (!recipient || recipient.user_id !== userId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notificationRecipient.delete({ where: { id } });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

export default router;
