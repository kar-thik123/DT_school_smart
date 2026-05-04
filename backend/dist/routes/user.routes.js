"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const license_check_1 = require("../utils/license-check");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, auth_middleware_1.authorizeRoles)('SUPER_ADMIN', 'SYSTEM_ADMIN', 'MANAGEMENT'));
const userSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['SUPER_ADMIN', 'TEACHER', 'STUDENT', 'MANAGEMENT']),
    grade_id: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
    section_id: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
});
// GET all teachers in org
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await prisma_1.default.user.findMany({
            where: {
                organization_id: req.user.organization_id,
                role: { is_teaching_role: true },
                is_active: true
            },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' }
        });
        res.json(teachers);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// GET all users in org
router.get('/', async (req, res) => {
    try {
        const filter = { organization_id: req.user.organization_id };
        if (req.query.grade_id) {
            filter.grade_id = String(req.query.grade_id);
        }
        if (req.query.section_id) {
            filter.section_id = String(req.query.section_id);
        }
        if (req.query.role) {
            // Look up the role_id for direct filtering (avoids nested relation filter issues)
            const roleRecord = await prisma_1.default.role.findFirst({
                where: { name: String(req.query.role), is_system: true, organization_id: req.user.organization_id }
            });
            if (roleRecord) {
                filter.role_id = roleRecord.id;
            }
        }
        console.log('[GET /api/users] filter:', JSON.stringify(filter));
        const users = await prisma_1.default.user.findMany({
            where: filter,
            select: { id: true, name: true, email: true, section_id: true, grade_id: true, role: { select: { name: true } }, is_active: true, created_at: true },
            orderBy: { name: 'asc' }
        });
        console.log('[GET /api/users] returned:', users.length, 'users');
        res.json(users.map((u) => ({ ...u, role: u.role.name })));
    }
    catch (error) {
        console.error('[GET /api/users] ERROR:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});
// POST create single user
router.post('/', async (req, res) => {
    try {
        const parsed = userSchema.parse(req.body);
        console.log('[POST /api/users] body:', JSON.stringify(req.body));
        console.log('[POST /api/users] parsed:', JSON.stringify(parsed));
        const org = await prisma_1.default.organization.findUnique({ where: { id: req.user.organization_id } });
        if (!org)
            return res.status(404).json({ message: 'Organization not found' });
        // Check license seat availability
        const licenseCheck = await (0, license_check_1.checkSeatAvailability)(req.user.organization_id, 1);
        if (!licenseCheck.allowed) {
            return res.status(403).json({
                message: licenseCheck.message,
                code: 'LICENSE_LIMIT_REACHED',
                usage: licenseCheck.usagePercent
            });
        }
        // Global email uniqueness check — email must be unique across ALL organisations
        const existing = await prisma_1.default.user.findFirst({ where: { email: parsed.email } });
        if (existing)
            return res.status(400).json({ message: `Email '${parsed.email}' is already registered in the platform. Each email can only belong to one account.` });
        const password_hash = await bcrypt_1.default.hash(parsed.password, 10);
        const roleDb = await prisma_1.default.role.findFirst({
            where: { name: parsed.role, is_system: true, organization_id: req.user.organization_id }
        });
        if (!roleDb)
            return res.status(400).json({ message: 'Role not found' });
        // Validate section belongs to grade if both provided
        if (parsed.section_id && parsed.grade_id) {
            const section = await prisma_1.default.section.findFirst({
                where: { id: parsed.section_id, grade_id: parsed.grade_id, organization_id: req.user.organization_id }
            });
            if (!section)
                return res.status(400).json({ message: 'Selected section does not belong to the selected grade' });
        }
        const user = await prisma_1.default.user.create({
            data: {
                name: parsed.name,
                email: parsed.email,
                password_hash,
                role_id: roleDb.id,
                organization_id: req.user.organization_id,
                grade_id: parsed.grade_id || null,
                section_id: parsed.section_id || null
            }
        });
        res.status(201).json({ message: 'User created', user: { id: user.id, name: user.name, email: user.email, role: parsed.role } });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues
            });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
// POST bulk import users via JSON array
router.post('/bulk', async (req, res) => {
    try {
        const users = req.body.users;
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: 'No users provided' });
        }
        const org = await prisma_1.default.organization.findUnique({ where: { id: req.user.organization_id } });
        if (!org)
            return res.status(404).json({ message: 'Organization not found' });
        // Check license seat availability for bulk
        const licenseCheck = await (0, license_check_1.checkSeatAvailability)(req.user.organization_id, users.length);
        if (!licenseCheck.allowed) {
            return res.status(403).json({
                message: licenseCheck.message,
                code: 'LICENSE_LIMIT_REACHED',
                usage: licenseCheck.usagePercent
            });
        }
        const results = { created: 0, skipped: 0, errors: [] };
        for (const u of users) {
            try {
                // Global email uniqueness check
                const existing = await prisma_1.default.user.findUnique({ where: { email: u.email } });
                if (existing) {
                    results.skipped++;
                    results.errors.push(`${u.email}: already registered in platform`);
                    continue;
                }
                const validRoles = ['SUPER_ADMIN', 'TEACHER', 'STUDENT', 'MANAGEMENT'];
                const role = validRoles.includes(u.role?.toUpperCase()) ? u.role.toUpperCase() : 'STUDENT';
                const password_hash = await bcrypt_1.default.hash(u.password || 'changeme123', 10);
                const roleDb = await prisma_1.default.role.findFirst({
                    where: { name: role, is_system: true, organization_id: req.user.organization_id }
                });
                if (!roleDb) {
                    results.skipped++;
                    continue;
                }
                await prisma_1.default.user.create({
                    data: { name: u.name, email: u.email, password_hash, role_id: roleDb.id, organization_id: req.user.organization_id, grade_id: u.grade_id || null, section_id: u.section_id || null }
                });
                results.created++;
            }
            catch (e) {
                results.errors.push(`${u.email}: failed`);
                results.skipped++;
            }
        }
        res.status(201).json({ message: 'Bulk import complete', ...results });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// PUT update user by id
router.put('/:id', async (req, res) => {
    try {
        const user = await prisma_1.default.user.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        let updateData = { name: req.body.name, is_active: req.body.is_active };
        if (req.body.role) {
            const roleDb = await prisma_1.default.role.findFirst({
                where: { name: req.body.role, is_system: true, organization_id: req.user.organization_id }
            });
            if (roleDb)
                updateData.role_id = roleDb.id;
        }
        const updated = await prisma_1.default.user.update({
            where: { id: req.params.id },
            data: updateData,
            include: { role: true }
        });
        res.json({ message: 'User updated', user: { ...updated, role: updated.role.name } });
    }
    catch (error) {
        if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
// PATCH deactivate
router.patch('/:id/deactivate', async (req, res) => {
    try {
        const user = await prisma_1.default.user.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        await prisma_1.default.user.update({ where: { id: req.params.id }, data: { is_active: false } });
        res.json({ message: 'User deactivated' });
    }
    catch (error) {
        if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
            return res.status(404).json({ message: 'User not found' });
        }
        console.error('User deactivate error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
