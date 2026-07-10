import { Request, Response, NextFunction } from 'express';
import { logAuditEvent, AuditLogPayload } from '../services/audit.service';

export const auditMiddleware = (req: Request | any, res: Response, next: NextFunction) => {
  // Only intercept mutations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Hook into response finish to ensure we only log successful transactions
  res.on('finish', async () => {
    // Only log if the request was successful (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      
      // Ensure the user is authenticated (e.g. authMiddleware ran)
      if (!req.user || !req.user.user_id || !req.user.organization_id) {
        return; // Cannot audit unauthenticated requests generically
      }

      // Check if the route provided explicit audit hints
      const auditHints = res.locals.audit || {};

      // Auto-determine action_type
      let action_type = auditHints.action_type;
      if (!action_type) {
        switch (req.method) {
          case 'POST': action_type = 'CREATE'; break;
          case 'PUT':
          case 'PATCH': action_type = 'UPDATE'; break;
          case 'DELETE': action_type = 'DELETE'; break;
          default: action_type = 'UPDATE';
        }
      }

      // Auto-determine entity_type based on baseUrl (e.g., /api/users -> USER)
      let entity_type = auditHints.entity_type;
      if (!entity_type) {
        const pathParts = req.baseUrl.split('/');
        const resource = pathParts[pathParts.length - 1]; // e.g. 'users'
        
        const resourceMap: any = {
          'users': 'USER',
          'roles': 'ROLE',
          'organizations': 'ORGANIZATION',
          'academic-years': 'ACADEMIC_STRUCTURE',
          'grades': 'ACADEMIC_STRUCTURE',
          'sections': 'ACADEMIC_STRUCTURE',
          'subjects': 'ACADEMIC_STRUCTURE',
          'enrollments': 'STUDENT_ENROLLMENT',
          'attendance': 'ATTENDANCE',
          'staff-attendance': 'ATTENDANCE',
          'exams': 'EXAMINATION',
          'settings': 'SETTINGS',
          'auth': 'AUTH',
          'bulk-import': 'BULK_IMPORT',
          'questions': 'QUESTION',
          'completions': 'COMPLETION',
        };
        entity_type = resourceMap[resource] || 'SYSTEM';
      }

      // Auto-determine entity_id
      let entity_id = auditHints.entity_id;
      if (!entity_id) {
        const parts = req.path.split('/').filter(Boolean);
        // If there's an ID in the URL, extract it
        if (parts.length > 0 && parts[0] !== 'bulk' && parts[0] !== 'sync-permissions' && parts[0] !== 'change-password') {
           entity_id = parts[0]; 
        } else {
           entity_id = 'SYSTEM';
        }
      }

      const payload: AuditLogPayload = {
        organization_id: req.user.organization_id,
        user_id: req.user.user_id,
        user_name: req.user.name,
        action_type: action_type as any,
        entity_type: entity_type as any,
        entity_id: entity_id,
        metadata: auditHints.metadata || { method: req.method, url: req.originalUrl }
      };

      try {
        await logAuditEvent(payload);
      } catch (err) {
        console.error('[Audit Middleware] Failed to log event:', err);
      }
    }
  });

  next();
};
