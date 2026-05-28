import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';


const router = Router();
router.use(authMiddleware);

// GET real audit logs mapped to System Log UI structure
router.get('/system-logs', async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;

    // Authorize: Only allow Super Admins and Management
    const isAuthorized = ['SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden: Requires administrative or management role to view audit logs.' });
    }

    const logs = await prisma.auditLog.findMany({
      where: { organization_id: org_id },
      orderBy: { timestamp: 'desc' },
      take: 100 // return latest 100 logs for performance
    });

    const mappedLogs = logs.map((log: any) => {
      let activity = `${log.action_type} ${log.entity_type}`;
      if (log.metadata && typeof log.metadata === 'object') {
        const meta = log.metadata as any;
        if (meta.description) {
          activity = meta.description;
        } else if (meta.level && meta.is_completed !== undefined) {
          activity = `Toggled ${meta.level.toLowerCase()} completion status to ${meta.is_completed ? 'completed' : 'incomplete'}`;
        }
      }

      let severity = 'Info';
      if (log.action_type === 'DELETE') severity = 'Warning';
      else if (log.action_type === 'LOGIN_FAILURE') severity = 'Critical';
      else if (log.action_type === 'ROLE_CHANGE' || log.action_type === 'PERMISSION_SYNC' || log.action_type === 'ACCESS_REVOKED') severity = 'Alert';

      return {
        id: log.id,
        timestamp: log.timestamp.toISOString().replace('T', ' ').substring(0, 19),
        user: log.user_name || 'System User',
        activity,
        module: log.entity_type,
        ipAddress: '127.0.0.1',
        severity,
        status: 'Success'
      };
    });

    return res.json(mappedLogs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET Settings for a specific module
router.get('/:module_name', async (req: any, res: Response) => {
  try {
    const { module_name } = req.params;
    const org_id = req.user.organization_id;

    // SYSTEM_ADMIN bypass removed. Rely on explicit permissions.
    const isSystemAdmin = false;
    if (!isSystemAdmin) {
      // All other roles (including SUPER_ADMIN, MANAGEMENT) must have explicit permission
      let requiredPerm = 'MASTER_CONFIGURATION:VIEW';
      if (module_name === 'completion') {
        requiredPerm = 'COMPLETION_TRACKING:VIEW';
      } else if (module_name === 'question-bank') {
        requiredPerm = 'QUESTION_BANK:VIEW';
      } else if (module_name === 'mcq') {
        requiredPerm = 'MCQ:VIEW';
      }

      const userPermissions: string[] = req.user?.permissions || [];
      if (!userPermissions.includes(requiredPerm)) {
        return res.status(403).json({ message: `Forbidden: Requires ${requiredPerm} permission.` });
      }
    }

    const config = await prisma.moduleConfig.findUnique({
      where: {
        organization_id_module_name: {
          organization_id: org_id,
          module_name
        }
      }
    });

    if (!config) {
      return res.json({ config_data: {} }); // Return empty config if none exists
    }

    return res.json(config);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT Settings for a specific module
router.put('/:module_name', async (req: any, res: Response) => {
  try {
    const { module_name } = req.params;
    const { config_data } = req.body;
    const org_id = req.user.organization_id;

    // SYSTEM_ADMIN bypass removed. Rely on explicit permissions.
    const isSystemAdmin = false;
    if (!isSystemAdmin) {
      // All other roles (including SUPER_ADMIN, MANAGEMENT) must have explicit permission
      let requiredPerm = 'MASTER_CONFIGURATION:MANAGE_CONFIG';
      if (module_name === 'completion') {
        requiredPerm = 'COMPLETION_TRACKING:MANAGE';
      } else if (module_name === 'question-bank') {
        requiredPerm = 'QUESTION_BANK:IMPORT';
      } else if (module_name === 'mcq') {
        requiredPerm = 'MASTER_CONFIGURATION:MANAGE_CONFIG';
      }

      const userPermissions: string[] = req.user?.permissions || [];
      if (!userPermissions.includes(requiredPerm)) {
        return res.status(403).json({ message: `Forbidden: Requires ${requiredPerm} permission.` });
      }
    }

    if (!config_data) {
      return res.status(400).json({ message: 'config_data is required' });
    }

    // Only persist the enforced fields — strip any stale/dead fields from old clients
    const sanitizedConfig: Record<string, unknown> = {};
    if (module_name === 'completion') {
      if (typeof config_data.enable_module === 'boolean') sanitizedConfig['enable_module'] = config_data.enable_module;
      if (typeof config_data.enable_notifications === 'boolean') sanitizedConfig['enable_notifications'] = config_data.enable_notifications;
    } else if (module_name === 'mcq') {
      if (typeof config_data.enable_module === 'boolean') sanitizedConfig['enable_module'] = config_data.enable_module;
    } else {
      // For other modules, pass through as-is
      Object.assign(sanitizedConfig, config_data);
    }

    const config = await prisma.moduleConfig.upsert({
      where: {
        organization_id_module_name: {
          organization_id: org_id,
          module_name
        }
      },
      update: { config_data: sanitizedConfig },
      create: {
        organization_id: org_id,
        module_name,
        config_data: sanitizedConfig
      }
    });

    return res.json(config);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
