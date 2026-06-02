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
const multer = require("multer");
const path = require("path");
const authorization_service_1 = require("../services/authorization.service");
const image_compression_util_1 = require("../utils/image-compression.util");
const upload = multer({ storage: multer.memoryStorage() });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use((0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'));
const userSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role_id: zod_1.z.string().uuid(),
    grade_id: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
    section_id: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
    admission_number: zod_1.z.string().optional(),
    mobile_number: zod_1.z.string().optional(),
});
// GET all teachers in org — only users whose role has IS_TEACHER but NOT IS_MANAGEMENT or IS_STUDENT
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await prisma_1.default.user.findMany({
            where: {
                organization_id: req.user.organization_id,
                is_active: true,
                role: {
                    permissions: {
                        some: { permission: { module: 'IDENTITY', action: 'IS_TEACHER' } }
                    },
                    AND: [
                        {
                            permissions: {
                                none: { permission: { module: 'IDENTITY', action: 'IS_MANAGEMENT' } }
                            }
                        },
                        {
                            permissions: {
                                none: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } }
                            }
                        }
                    ]
                }
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
            // Allow searching by role name dynamically without hardcoding
            const roleRecords = await prisma_1.default.role.findMany({
                where: {
                    name: String(req.query.role),
                    OR: [
                        { organization_id: req.user.organization_id },
                        { is_system: true }
                    ]
                }
            });
            if (roleRecords.length > 0) {
                filter.role_id = { in: roleRecords.map((r) => r.id) };
            }
        }
        console.log('[GET /api/users] filter:', JSON.stringify(filter));
        const users = await prisma_1.default.user.findMany({
            where: filter,
            select: {
                id: true, name: true, email: true, section_id: true, grade_id: true, role_id: true,
                role: { select: { name: true } },
                grade: { select: { name: true } },
                section: { select: { name: true } },
                is_active: true, created_at: true
            },
            orderBy: { name: 'asc' }
        });
        console.log('[GET /api/users] returned:', users.length, 'users');
        res.json(users.map((u) => ({
            ...u,
            role: u.role?.name,
            grade_name: u.grade?.name || null,
            section_name: u.section?.name || null
        })));
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
            where: {
                id: parsed.role_id,
                OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
            }
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
                role_id: parsed.role_id,
                organization_id: req.user.organization_id,
                grade_id: parsed.grade_id || null,
                section_id: parsed.section_id || null
            }
        });
        // Check if role has IDENTITY:IS_STUDENT
        const isStudent = await prisma_1.default.rolePermission.findFirst({
            where: {
                role_id: parsed.role_id,
                permission: { module: 'IDENTITY', action: 'IS_STUDENT' }
            }
        });
        if (isStudent && (parsed.admission_number || parsed.mobile_number)) {
            await prisma_1.default.studentProfile.create({
                data: {
                    user_id: user.id,
                    organization_id: req.user.organization_id,
                    admission_number: parsed.admission_number || null,
                    mobile_number: parsed.mobile_number || null
                }
            });
        }
        // Explicit return to prevent ERR_HTTP_HEADERS_SENT
        return res.status(201).json({ message: 'User created', user: { id: user.id, name: user.name, email: user.email, role_id: parsed.role_id } });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues
            });
        }
        console.error('[POST /api/users] Error:', error.stack || error);
        return res.status(500).json({ message: 'Server error' });
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
                let roleId = u.role_id;
                if (!roleId && u.role) {
                    // Dynamic fallback by name if string is provided
                    const roleDb = await prisma_1.default.role.findFirst({
                        where: {
                            name: { equals: u.role, mode: 'insensitive' },
                            OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
                        }
                    });
                    if (roleDb)
                        roleId = roleDb.id;
                }
                if (!roleId) {
                    // Ultimate fallback to ANY IS_STUDENT role
                    const studentRole = await prisma_1.default.role.findFirst({
                        where: {
                            permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } } },
                            OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
                        }
                    });
                    if (studentRole)
                        roleId = studentRole.id;
                }
                if (!roleId) {
                    results.skipped++;
                    results.errors.push(`${u.email}: valid role could not be resolved`);
                    continue;
                }
                const password_hash = await bcrypt_1.default.hash(u.password || 'changeme123', 10);
                const newUser = await prisma_1.default.user.create({
                    data: { name: u.name, email: u.email, password_hash, role_id: roleId, organization_id: req.user.organization_id, grade_id: u.grade_id || null, section_id: u.section_id || null }
                });
                // Check if student
                const isStudent = await prisma_1.default.rolePermission.findFirst({
                    where: { role_id: roleId, permission: { module: 'IDENTITY', action: 'IS_STUDENT' } }
                });
                if (isStudent && (u.admission_number || u.mobile_number)) {
                    await prisma_1.default.studentProfile.create({
                        data: {
                            user_id: newUser.id,
                            organization_id: req.user.organization_id,
                            admission_number: u.admission_number || null,
                            mobile_number: u.mobile_number || null
                        }
                    });
                }
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
        const user = await prisma_1.default.user.findFirst({
            where: { id: req.params.id, organization_id: req.user.organization_id },
            include: { role: true }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // Self-protection: SUPER_ADMIN cannot demote or mutate their own owner account
        if (user.role?.name === 'SUPER_ADMIN' && user.id === req.user.user_id) {
            // Allow safe edits (name) but block role changes or deactivation
            if (req.body.role_id || req.body.role || req.body.is_active === false) {
                return res.status(403).json({ message: 'Tenant owner account cannot perform self-destructive actions.' });
            }
        }
        let updateData = { name: req.body.name, is_active: req.body.is_active };
        if (req.body.role_id) {
            const roleDb = await prisma_1.default.role.findFirst({
                where: {
                    id: req.body.role_id,
                    OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
                }
            });
            if (roleDb)
                updateData.role_id = roleDb.id;
        }
        else if (req.body.role) {
            // Legacy support for string updates if any still exist
            const roleDb = await prisma_1.default.role.findFirst({
                where: { name: req.body.role, OR: [{ organization_id: req.user.organization_id }, { is_system: true }] }
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
// PATCH status
router.patch('/:id/status', async (req, res) => {
    try {
        const { is_active } = req.body;
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ message: 'is_active must be a boolean' });
        }
        const user = await prisma_1.default.user.findFirst({
            where: { id: req.params.id, organization_id: req.user.organization_id },
            include: { role: true }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // Self-protection: SUPER_ADMIN cannot deactivate themselves
        if (user.role?.name === 'SUPER_ADMIN' && user.id === req.user.user_id) {
            return res.status(403).json({ message: 'Tenant owner account cannot perform self-destructive actions.' });
        }
        await prisma_1.default.user.update({ where: { id: req.params.id }, data: { is_active } });
        res.json({ message: `User ${is_active ? 'activated' : 'deactivated'}` });
    }
    catch (error) {
        if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
            return res.status(404).json({ message: 'User not found' });
        }
        console.error('User status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        const user = await prisma_1.default.user.findFirst({
            where: { id: req.params.id, organization_id: req.user.organization_id },
            include: { role: true }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // Self-protection: SUPER_ADMIN cannot delete themselves — would orphan the tenant
        if (user.role?.name === 'SUPER_ADMIN' && user.id === req.user.user_id) {
            return res.status(403).json({ message: 'Tenant owner account cannot perform self-destructive actions.' });
        }
        await prisma_1.default.user.delete({ where: { id: req.params.id } });
        res.json({ message: 'User deleted' });
    }
    catch (error) {
        if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
            return res.status(404).json({ message: 'User not found' });
        }
        console.error('User delete error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// POST admin-triggered reset password link
router.post('/:id/reset-password', async (req, res) => {
    try {
        const targetUser = await prisma_1.default.user.findFirst({
            where: { id: req.params.id, organization_id: req.user.organization_id },
            include: { role: true }
        });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Role restriction check: Protect SYSTEM_ADMIN from being reset by standard tenant admins
        const isSystemAdmin = authorization_service_1.AuthorizationService.hasIdentity(req.user.permissions || [], 'IS_SYSTEM_ADMIN');
        if (targetUser.role?.name === 'SYSTEM_ADMIN' && !isSystemAdmin) {
            return res.status(403).json({ message: 'Cannot reset password for SYSTEM_ADMIN' });
        }
        // Self-protection: SUPER_ADMIN cannot admin-reset their own password via user management
        // (they should use the standard forgot-password flow instead)
        if (targetUser.role?.name === 'SUPER_ADMIN' && targetUser.id === req.user.user_id) {
            return res.status(403).json({ message: 'Tenant owner account cannot perform self-destructive actions.' });
        }
        const { randomBytes } = require('crypto');
        const nodemailer = require('nodemailer');
        const token = randomBytes(32).toString('hex');
        const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        // Existing token cleanup
        await prisma_1.default.passwordReset.deleteMany({
            where: { user_id: targetUser.id, used: false }
        });
        await prisma_1.default.passwordReset.create({
            data: { user_id: targetUser.id, token, expires_at }
        });
        const baseUrl = process.env.FRONTEND_URL || 'https://app.platform.com';
        const resetUrl = `${baseUrl}/#/authentication/reset-password?token=${token}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL || 'sam21cs1188@gmail.com',
                pass: process.env.SMTP_PASSWORD || 'mggc wifs yaas yika'
            }
        });
        try {
            await transporter.sendMail({
                from: `"School Support" <${process.env.SMTP_EMAIL || 'sam21cs1188@gmail.com'}>`,
                to: targetUser.email,
                subject: 'Password Reset Request',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
            <h2 style="color: #059669;">Reset Your Password</h2>
            <p>Hello ${targetUser.name},</p>
            <p>Your administrator has requested a password reset for your account. Click the secure link below to proceed:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; color:#ffffff; background-color:#10b981; border-radius:8px; text-decoration:none; font-weight:bold;">Set New Password</a>
            </div>
            <p style="font-size:14px; color:#666;">This link is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        `
            });
            res.json({ message: 'Password reset link sent to user email' });
        }
        catch (emailError) {
            console.error('[SMTP Error] Failed to send email:', emailError.message);
            // Even if email fails, we might want to return 500 so the frontend knows it failed
            return res.status(500).json({ message: 'Failed to dispatch email. Check SMTP configuration.' });
        }
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.params.id },
            include: { role: true, user_profile: true }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const profileData = user.user_profile ? {
            phone: user.user_profile.phone,
            city: user.user_profile.city,
            country: user.user_profile.country,
            address: user.user_profile.address,
            about: user.user_profile.about,
            profile_image: user.user_profile.profile_image,
            academic_profiles: user.user_profile.academic_profiles || [],
            skills: user.user_profile.skills || []
        } : {
            academic_profiles: [],
            skills: []
        };
        res.json({ ...user, ...profileData });
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/profile/:id', upload.single('profile_image'), async (req, res) => {
    try {
        let { name, email, phone, city, country, address, about, academic_profiles, skills } = req.body;
        // Handle multipart/form-data where JSON arrays are sent as strings
        if (typeof academic_profiles === 'string') {
            try {
                academic_profiles = JSON.parse(academic_profiles);
            }
            catch (e) {
                academic_profiles = [];
            }
        }
        if (typeof skills === 'string') {
            try {
                skills = JSON.parse(skills);
            }
            catch (e) {
                skills = [];
            }
        }
        let profile_image = undefined;
        if (req.file) {
            const outputDir = path.join(process.cwd(), 'uploads', 'profile');
            const processed = await (0, image_compression_util_1.processImage)(req.file.buffer, req.file.originalname, {
                outputDirectory: outputDir,
                width: 800,
                height: 800,
                quality: 80,
                format: 'webp',
                skipIfSmall: true
            });
            profile_image = `/uploads/profile/${processed.filename}`;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.params.id }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Update core User fields
        await prisma_1.default.user.update({
            where: { id: req.params.id },
            data: { name, email }
        });
        // Upsert UserProfile fields
        const updateData = { phone, city, country, address, about, academic_profiles };
        if (profile_image) {
            updateData.profile_image = profile_image;
        }
        await prisma_1.default.userProfile.upsert({
            where: { user_id: req.params.id },
            update: updateData,
            create: {
                user_id: req.params.id,
                organization_id: user.organization_id,
                phone,
                city,
                country,
                address,
                about,
                profile_image,
                academic_profiles: academic_profiles || []
            }
        });
        res.json({ message: 'Profile updated successfully', user_profile: { profile_image } });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
