import prisma from '../prisma';

export class SecurityLogService {
  /**
   * Logs an access governance event (Role change, Permission sync, etc.)
   */
  static async logEvent(data: {
    actor_id: string;
    organization_id: string;
    event_type: 'ROLE_CHANGE' | 'PERMISSION_SYNC' | 'ACCESS_REVOKED' | 'LOGIN_FAILURE';
    description: string;
    target_user_id?: string;
    metadata?: any;
  }) {
    try {
      console.log(`[SECURITY_AUDIT] ${data.event_type}: ${data.description} by ${data.actor_id}`);
      
      await prisma.auditLog.create({
        data: {
          organization_id: data.organization_id,
          user_id: data.actor_id,
          action_type: data.event_type,
          entity_type: 'ROLE_PERMISSION',
          entity_id: data.target_user_id || data.metadata?.roleId || 'SYSTEM',
          metadata: { description: data.description, ...data.metadata }
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
