import prisma from '../prisma';
import { eventBus, EventTypes, NotificationEventPayload } from './events.service';
import { AudienceResolver } from './audience-resolver.service';

export class NotificationService {
  
  static initListeners() {
    eventBus.on(EventTypes.COMPLETION_TOPIC_ENABLED, async (payload: NotificationEventPayload) => {
      await NotificationService.processCompletionEvent(payload, 'COMPLETION_TRACKING', 'VIEW');
    });
    eventBus.on(EventTypes.COMPLETION_SUBTOPIC_ENABLED, async (payload: NotificationEventPayload) => {
      await NotificationService.processCompletionEvent(payload, 'COMPLETION_TRACKING', 'VIEW');
    });
    eventBus.on(EventTypes.COMPLETION_UNIT_ENABLED, async (payload: NotificationEventPayload) => {
      await NotificationService.processCompletionEvent(payload, 'COMPLETION_TRACKING', 'VIEW');
    });
  }

  private static async processCompletionEvent(payload: NotificationEventPayload, reqMod: string, reqAct: string) {
    try {
      // 1. Resolve Target Audience
      const recipientIds = await AudienceResolver.resolveByPermissionAndContext(payload, reqMod, reqAct);
      if (recipientIds.length === 0) return;

      // 2. Build Message
      const title = `New ${payload.entity.type} Available`;
      const message = `${payload.entity.name} is now available.`;

      // 3. Persist Notification (Batch)
      const notification = await prisma.notification.create({
        data: {
          organization_id: payload.organization_id,
          event_type: payload.entity.type, // e.g., 'TOPIC' or full string
          entity_type: payload.entity.type,
          entity_id: payload.entity.id,
          title,
          message,
          actor_id: payload.actor_id,
          context_data: payload.context as any,
          recipients: {
            create: recipientIds.map(userId => ({
              user_id: userId
            }))
          }
        },
        include: { recipients: true }
      });

      // 4. Real-time Dispatch
      NotificationService.dispatchRealtime(notification);

    } catch (error) {
      console.error('Error processing notification event:', error);
    }
  }

  private static dispatchRealtime(notification: any) {
    try {
      const { io } = require('../server');
      if (io) {
        notification.recipients.forEach((recipient: any) => {
          // Flatten for UI compat
          const uiNotif = {
            ...notification,
            id: recipient.id,
            notification_id: notification.id,
            isRead: recipient.is_read,
            userId: recipient.user_id,
            referenceId: notification.entity_id,
            type: notification.event_type,
            icon: 'bell',
            color: 'text-primary'
          };
          delete uiNotif.recipients;
          
          io.to(`user:${recipient.user_id}`).emit('new-notification', uiNotif);
        });
      }
    } catch (e) {
      console.warn('Realtime dispatch failed. Ensure socket.io is initialized.');
    }
  }
}

// Initialize when imported
NotificationService.initListeners();
