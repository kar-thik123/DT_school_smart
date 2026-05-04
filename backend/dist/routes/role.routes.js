"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const security_log_service_1 = require("../services/security-log.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Middleware: Only Admins can manage roles
router.use(auth_middleware_1.authMiddleware);
router.use((0, auth_middleware_1.authorizeRoles)('SYSTEM_ADMIN', 'SUPER_ADMIN'));
const roleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    is_teaching_role: zod_1.z.boolean().optional().default(false)
});
const permissionSyncSchema = zod_1.z.object({
    permissionIds: zod_1.z.array(zod_1.z.string().uuid())
});
/**
 * GET /api/roles
 * List all roles for the current organization
 */
router.get('/', async (req, res) => {
    try {
        const isSystemAdmin = req.user.role === 'SYSTEM_ADMIN';
        const roles = await prisma_1.default.role.findMany({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
/**
 * GET /api/roles/available-permissions
 * Get all possible permissions from the registry (DB)
 */
router.get('/available-permissions', async (req, res) => {
    try {
        const permissions = await prisma_1.default.permission.findMany({
            orderBy: [{ module: 'asc' }, { action: 'asc' }]
        });
        res.json(permissions);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
/**
 * GET /api/roles/:id/permissions
 * Get active permissions for a specific role
 */
router.get('/:id/permissions', async (req, res) => {
    try {
        const role = await prisma_1.default.role.findUnique({ where: { id: req.params.id } });
        if (!role)
            return res.status(404).json({ message: 'Role not found' });
        // Scoping check
        if (role.organization_id && role.organization_id !== req.user.organization_id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const rolePermissions = await prisma_1.default.rolePermission.findMany({
            where: { role_id: req.params.id },
            include: { permission: true }
        });
        res.json(rolePermissions.map((rp) => rp.permission));
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
/**
 * POST /api/roles
 * Create a custom organization-scoped role
 */
router.post('/', async (req, res) => {
    try {
        const parsed = roleSchema.parse(req.body);
        // Ensure name uniqueness within org
        const existing = await prisma_1.default.role.findFirst({
            where: { name: parsed.name, organization_id: req.user.organization_id }
        });
        if (existing)
            return res.status(400).json({ message: 'Role name already exists in your school' });
        const role = await prisma_1.default.role.create({
            data: {
                name: parsed.name,
                description: parsed.description,
                is_teaching_role: parsed.is_teaching_role,
                organization_id: req.user.organization_id,
                is_system: false
            }
        });
        res.status(201).json(role);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
/**
 * POST /api/roles/:id/sync-permissions
 * Atomically update all permissions for a role
 */
router.post('/:id/sync-permissions', async (req, res) => {
    try {
        const { permissionIds } = permissionSyncSchema.parse(req.body);
        const role = await prisma_1.default.role.findUnique({ where: { id: req.params.id } });
        if (!role)
            return res.status(404).json({ message: 'Role not found' });
        // Security check: cannot modify system roles unless SYSTEM_ADMIN
        if (role.is_system && req.user.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({ message: 'Cannot modify system roles' });
        }
        // Transactional sync
        await prisma_1.default.$transaction([
            prisma_1.default.rolePermission.deleteMany({ where: { role_id: req.params.id } }),
            prisma_1.default.rolePermission.createMany({
                data: permissionIds.map(pid => ({
                    role_id: req.params.id,
                    permission_id: pid
                }))
            })
        ]);
        await security_log_service_1.SecurityLogService.logEvent({
            actor_id: req.user.user_id,
            organization_id: req.user.organization_id,
            event_type: 'PERMISSION_SYNC',
            description: `Updated permissions for role: ${role.name}`,
            metadata: { roleId: role.id, permissionCount: permissionIds.length }
        });
        res.json({ message: 'Permissions synced successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
/**
 * PUT /api/roles/:id
 * Update role name and description
 */
router.put('/:id', async (req, res) => {
    try {
        const parsed = roleSchema.parse(req.body);
        const role = await prisma_1.default.role.findUnique({ where: { id: req.params.id } });
        if (!role)
            return res.status(404).json({ message: 'Role not found' });
        if (role.is_system)
            return res.status(403).json({ message: 'Cannot modify system roles' });
        if (role.organization_id !== req.user.organization_id)
            return res.status(403).json({ message: 'Forbidden' });
        const updated = await prisma_1.default.role.update({
            where: { id: req.params.id },
            data: { name: parsed.name, description: parsed.description, is_teaching_role: parsed.is_teaching_role }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
/**
 * DELETE /api/roles/:id
 * Delete a custom role if no users are assigned
 */
router.delete('/:id', async (req, res) => {
    try {
        const role = await prisma_1.default.role.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { users: true } } }
        });
        if (!role)
            return res.status(404).json({ message: 'Role not found' });
        if (role.is_system)
            return res.status(403).json({ message: 'Cannot delete system roles' });
        if (role.organization_id !== req.user.organization_id)
            return res.status(403).json({ message: 'Forbidden' });
        if (role._count.users > 0) {
            return res.status(400).json({ message: `Cannot delete role '${role.name}' because ${role._count.users} users are assigned to it` });
        }
        await prisma_1.default.role.delete({ where: { id: req.params.id } });
        res.json({ message: 'Role deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
/**
 * POST /api/roles/:id/clone
 * Clone a role and its permissions
 */
router.post('/:id/clone', async (req, res) => {
    try {
        const { name, description } = roleSchema.parse(req.body);
        const sourceRole = await prisma_1.default.role.findUnique({
            where: { id: req.params.id },
            include: { permissions: true }
        });
        if (!sourceRole)
            return res.status(404).json({ message: 'Source role not found' });
        // Scoping check
        if (sourceRole.organization_id && sourceRole.organization_id !== req.user.organization_id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        // Ensure name uniqueness
        const existing = await prisma_1.default.role.findFirst({
            where: { name, organization_id: req.user.organization_id }
        });
        if (existing)
            return res.status(400).json({ message: 'Role name already exists' });
        const newRole = await prisma_1.default.$transaction(async (tx) => {
            const role = await tx.role.create({
                data: {
                    name,
                    description,
                    is_teaching_role: sourceRole.is_teaching_role,
                    organization_id: req.user.organization_id,
                    is_system: false
                }
            });
            if (sourceRole.permissions.length > 0) {
                await tx.rolePermission.createMany({
                    data: sourceRole.permissions.map((rp) => ({
                        role_id: role.id,
                        permission_id: rp.permission_id
                    }))
                });
            }
            return role;
        });
        res.status(201).json(newRole);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.default = router;
