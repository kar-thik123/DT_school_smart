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
    eventBus.on(EventTypes.STUDENT_TOPIC_COMPLETION, async (payload: NotificationEventPayload) => {
      await NotificationService.processCompletionEvent(payload, 'COMPLETION_TRACKING', 'MANAGE');
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
      const notification = await NotificationService.sendNotification({
        organization_id: payload.organization_id,
        event_type: payload.entity.type, // e.g., 'TOPIC' or full string
        entity_type: payload.entity.type,
        entity_id: payload.entity.id,
        title,
        message,
        actor_id: payload.actor_id,
        context_data: payload.context as any,
        recipient_ids: recipientIds
      });

      // Real-time dispatch is handled inside sendNotification
    } catch (error) {
      console.error('Error processing notification event:', error);
    }
  }

  static async sendNotification(params: {
    organization_id: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    title: string;
    message: string;
    actor_id?: string;
    context_data?: any;
    recipient_ids: string[];
  }) {
    try {
      if (!params.recipient_ids || params.recipient_ids.length === 0) return null;

      const notification = await prisma.notification.create({
        data: {
          organization_id: params.organization_id,
          event_type: params.event_type,
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          title: params.title,
          message: params.message,
          actor_id: params.actor_id,
          context_data: params.context_data || {},
          recipients: {
            create: params.recipient_ids.map(userId => ({
              user_id: userId
            }))
          }
        },
        include: { recipients: true }
      });

      NotificationService.dispatchRealtime(notification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  private static ioInstance: any = null;

  static setIO(io: any) {
    this.ioInstance = io;
  }

  private static dispatchRealtime(notification: any) {
    try {
      const io = (global as any).io;
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
            type: notification.event_type === 'INTERNAL_MAIL' ? 'email' : notification.event_type,
            icon: notification.context_data?.icon || 'bell',
            color: notification.context_data?.color || 'text-primary'
          };
          delete uiNotif.recipients;
          
          io.to(`user:${recipient.user_id}`).emit('new-notification', uiNotif);
        });
      } else {
        console.warn('Realtime dispatch bypassed: global.io is undefined');
      }
    } catch (e) {
      console.warn('Realtime dispatch failed:', e);
    }
  }
}

// Initialize when imported
NotificationService.initListeners();
