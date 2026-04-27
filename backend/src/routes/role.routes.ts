import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';
import { SecurityLogService } from '../services/security-log.service';
import { z } from 'zod';

const router = Router();

// Middleware: Only Admins can manage roles
router.use(authMiddleware);
router.use(authorizeRoles('SYSTEM_ADMIN', 'SUPER_ADMIN'));

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

const permissionSyncSchema = z.object({
  permissionIds: z.array(z.string().uuid())
});

/**
 * GET /api/roles
 * List all roles for the current organization
 */
router.get('/', async (req: any, res: Response) => {
  try {
    const isSystemAdmin = req.user.role === 'SYSTEM_ADMIN';
    
    const roles = await prisma.role.findMany({
      where: { 
        ...(isSystemAdmin ? {} : { 
          organization_id: req.user.organization_id,
          name: { not: 'SYSTEM_ADMIN' }
        })
      },
      include: {
        _count: { select: { users: true, permissions: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/roles/available-permissions
 * Get all possible permissions from the registry (DB)
 */
router.get('/available-permissions', async (req: any, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }]
    });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/roles/:id/permissions
 * Get active permissions for a specific role
 */
router.get('/:id/permissions', async (req: any, res: Response) => {
  try {
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    
    // Scoping check
    if (role.organization_id && role.organization_id !== req.user.organization_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role_id: req.params.id },
      include: { permission: true }
    });
    res.json(rolePermissions.map((rp: any) => rp.permission));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/roles
 * Create a custom organization-scoped role
 */
router.post('/', async (req: any, res: Response) => {
  try {
    const parsed = roleSchema.parse(req.body);
    
    // Ensure name uniqueness within org
    const existing = await prisma.role.findFirst({
      where: { name: parsed.name, organization_id: req.user.organization_id }
    });
    if (existing) return res.status(400).json({ message: 'Role name already exists in your school' });

    const role = await prisma.role.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        organization_id: req.user.organization_id,
        is_system: false
      }
    });
    res.status(201).json(role);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * POST /api/roles/:id/sync-permissions
 * Atomically update all permissions for a role
 */
router.post('/:id/sync-permissions', async (req: any, res: Response) => {
  try {
    const { permissionIds } = permissionSyncSchema.parse(req.body);
    
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    
    // Security check: cannot modify system roles unless SYSTEM_ADMIN
    if (role.is_system && req.user.role !== 'SYSTEM_ADMIN') {
        return res.status(403).json({ message: 'Cannot modify system roles' });
    }

    // Transactional sync
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role_id: req.params.id } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map(pid => ({
          role_id: req.params.id,
          permission_id: pid
        }))
      })
    ]);

    await SecurityLogService.logEvent({
      actor_id: req.user.user_id,
      organization_id: req.user.organization_id,
      event_type: 'PERMISSION_SYNC',
      description: `Updated permissions for role: ${role.name}`,
      metadata: { roleId: role.id, permissionCount: permissionIds.length }
    });

    res.json({ message: 'Permissions synced successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PUT /api/roles/:id
 * Update role name and description
 */
router.put('/:id', async (req: any, res: Response) => {
  try {
    const parsed = roleSchema.parse(req.body);
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });

    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.is_system) return res.status(403).json({ message: 'Cannot modify system roles' });
    if (role.organization_id !== req.user.organization_id) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.role.update({
      where: { id: req.params.id },
      data: { name: parsed.name, description: parsed.description }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE /api/roles/:id
 * Delete a custom role if no users are assigned
 */
router.delete('/:id', async (req: any, res: Response) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true } } }
    });

    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.is_system) return res.status(403).json({ message: 'Cannot delete system roles' });
    if (role.organization_id !== req.user.organization_id) return res.status(403).json({ message: 'Forbidden' });

    if (role._count.users > 0) {
      return res.status(400).json({ message: `Cannot delete role '${role.name}' because ${role._count.users} users are assigned to it` });
    }

    await prisma.role.delete({ where: { id: req.params.id } });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/roles/:id/clone
 * Clone a role and its permissions
 */
router.post('/:id/clone', async (req: any, res: Response) => {
  try {
    const { name, description } = roleSchema.parse(req.body);
    const sourceRole = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { permissions: true }
    });

    if (!sourceRole) return res.status(404).json({ message: 'Source role not found' });

    // Scoping check
    if (sourceRole.organization_id && sourceRole.organization_id !== req.user.organization_id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Ensure name uniqueness
    const existing = await prisma.role.findFirst({
      where: { name, organization_id: req.user.organization_id }
    });
    if (existing) return res.status(400).json({ message: 'Role name already exists' });

    const newRole = await prisma.$transaction(async (tx: any) => {
      const role = await tx.role.create({
        data: {
          name,
          description,
          organization_id: req.user.organization_id,
          is_system: false
        }
      });

      if (sourceRole.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: sourceRole.permissions.map((rp: any) => ({
            role_id: role.id,
            permission_id: rp.permission_id
          }))
        });
      }

      return role;
    });

    res.status(201).json(newRole);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
