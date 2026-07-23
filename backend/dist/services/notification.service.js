"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const events_service_1 = require("./events.service");
const audience_resolver_service_1 = require("./audience-resolver.service");
class NotificationService {
    static initListeners() {
        events_service_1.eventBus.on(events_service_1.EventTypes.COMPLETION_TOPIC_ENABLED, async (payload) => {
            await NotificationService.processCompletionEvent(payload, 'COMPLETION_TRACKING', 'VIEW');
        });
        events_service_1.eventBus.on(events_service_1.EventTypes.COMPLETION_SUBTOPIC_ENABLED, async (payload) => {
            await NotificationService.processCompletionEvent(payload, 'COMPLETION_TRACKING', 'VIEW');
        });
        events_service_1.eventBus.on(events_service_1.EventTypes.COMPLETION_UNIT_ENABLED, async (payload) => {
            await NotificationService.processCompletionEvent(payload, 'COMPLETION_TRACKING', 'VIEW');
        });
        events_service_1.eventBus.on(events_service_1.EventTypes.STUDENT_TOPIC_COMPLETION, async (payload) => {
            await NotificationService.processCompletionEvent(payload, 'COMPLETION_TRACKING', 'MANAGE');
        });
    }
    static async processCompletionEvent(payload, reqMod, reqAct) {
        try {
            // 1. Resolve Target Audience
            const recipientIds = await audience_resolver_service_1.AudienceResolver.resolveByPermissionAndContext(payload, reqMod, reqAct);
            if (recipientIds.length === 0)
                return;
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
                context_data: payload.context,
                recipient_ids: recipientIds
            });
            // Real-time dispatch is handled inside sendNotification
        }
        catch (error) {
            console.error('Error processing notification event:', error);
        }
    }
    static async sendNotification(params) {
        try {
            if (!params.recipient_ids || params.recipient_ids.length === 0)
                return null;
            const notification = await prisma_1.default.notification.create({
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
        }
        catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    }
    static ioInstance = null;
    static setIO(io) {
        this.ioInstance = io;
    }
    static dispatchRealtime(notification) {
        try {
            const io = global.io;
            if (io) {
                notification.recipients.forEach((recipient) => {
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
            }
            else {
                console.warn('Realtime dispatch bypassed: global.io is undefined');
            }
        }
        catch (e) {
            console.warn('Realtime dispatch failed:', e);
        }
    }
}
exports.NotificationService = NotificationService;
// Initialize when imported
NotificationService.initListeners();
