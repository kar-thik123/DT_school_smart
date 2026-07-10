import prisma from '../prisma';

export interface AuditLogPayload {
  organization_id: string;
  user_id: string;
  user_name?: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'TOGGLE' | 'IMPORT' | 'ASSIGN' | 'LOGIN' | 'LOGOUT' | 'RESET_PASSWORD';
  entity_type: 'QUESTION' | 'COMPLETION' | 'TEACHER_ASSIGNMENT' | 'SYLLABUS' | 'ROLE_PERMISSION' | 'ACADEMIC_STRUCTURE' | 'USER' | 'ORGANIZATION' | 'ROLE' | 'ATTENDANCE' | 'EXAMINATION' | 'STUDENT_ENROLLMENT' | 'SETTINGS' | 'AUTH' | 'BULK_IMPORT';
  entity_id: string;
  metadata?: any;
}

export const logAuditEvent = async (payload: AuditLogPayload) => {
  try {
    await prisma.auditLog.create({
      data: {
        organization_id: payload.organization_id,
        user_id: payload.user_id,
        user_name: payload.user_name || null,
        action_type: payload.action_type,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        metadata: payload.metadata || null
      }
    });
  } catch (error) {
    console.error('[Audit Logger Error]', error);
  }
};
