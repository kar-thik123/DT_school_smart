"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
// Removed inline nodemailer import
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const email_link_builder_service_1 = require("../services/email-link-builder.service");
const email_service_1 = require("../services/email.service");
const router = (0, express_1.Router)();
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: 'Too many login attempts, please try again later'
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const parsed = loginSchema.parse(req.body);
        const user = await prisma_1.default.user.findFirst({
            where: { email: parsed.email },
            include: {
                organization: true,
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }
        if (!user.is_active) {
            return res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }
        if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
            return res.status(401).json({ message: 'Too many failed attempts. Try again after 15 minutes' });
        }
        const isMatch = await bcrypt_1.default.compare(parsed.password, user.password_hash);
        if (!isMatch) {
            const failedAttempts = user.failed_login_attempts + 1;
            let lockedUntil = null;
            let actionType = 'LOGIN_FAILED';
            let errorMessage = 'Invalid credentials or inactive account';
            if (failedAttempts >= 5) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                actionType = 'ACCOUNT_LOCKED';
                errorMessage = 'Too many failed attempts. Try again after 15 minutes.';
            }
            else {
                const remaining = 5 - failedAttempts;
                if (remaining <= 3) {
                    errorMessage = `Invalid credentials or inactive account, ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`;
                }
            }
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: { failed_login_attempts: failedAttempts, locked_until: lockedUntil }
            });
            await prisma_1.default.auditLog.create({
                data: {
                    organization_id: user.organization_id,
                    user_id: user.id,
                    user_name: user.name,
                    action_type: actionType,
                    entity_type: 'USER',
                    entity_id: user.id,
                    metadata: { ip: req.ip, email: parsed.email }
                }
            });
            return res.status(401).json({ message: errorMessage });
        }
        if (user.failed_login_attempts > 0 || user.locked_until) {
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: { failed_login_attempts: 0, locked_until: null }
            });
            await prisma_1.default.auditLog.create({
                data: {
                    organization_id: user.organization_id,
                    user_id: user.id,
                    user_name: user.name,
                    action_type: 'ACCOUNT_UNLOCKED',
                    entity_type: 'USER',
                    entity_id: user.id,
                    metadata: { ip: req.ip, reason: 'successful_login' }
                }
            });
        }
        await prisma_1.default.auditLog.create({
            data: {
                organization_id: user.organization_id,
                user_id: user.id,
                user_name: user.name,
                action_type: 'LOGIN_SUCCESS',
                entity_type: 'USER',
                entity_id: user.id,
                metadata: { ip: req.ip }
            }
        });
        // --- HOSTNAME BASED TENANT VALIDATION ---
        const hostname = req.hostname || '';
        let mappedOrgId = null;
        let orgDomain = await prisma_1.default.organization.findFirst({ where: { custom_domain: hostname } });
        if (!orgDomain) {
            const parts = hostname.split('.');
            if (parts.length > 0) {
                orgDomain = await prisma_1.default.organization.findFirst({ where: { subdomain: parts[0] } });
            }
        }
        if (orgDomain) {
            mappedOrgId = orgDomain.id;
        }
        if (!mappedOrgId) {
            // Platform Domain
            if (user.role?.name !== 'SYSTEM_ADMIN') {
                const domainType = user.organization?.domain_type?.toLowerCase() || '';
                if (domainType !== 'platform domain' && domainType !== 'platform_domain' && domainType !== 'on_premise') {
                    return res.status(403).json({ message: 'Please log in through your organization\'s assigned domain.' });
                }
            }
        }
        else {
            // Subdomain or Custom Domain
            if (user.organization_id !== mappedOrgId) {
                return res.status(403).json({ message: 'You do not have access to this portal.' });
            }
        }
        // ----------------------------------------
        const permissions = user.role.permissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`);
        // Inject identity fallbacks
        const roleName = user.role.name || '';
        if (roleName === 'SYSTEM_ADMIN') {
            permissions.push('IDENTITY:IS_SYSTEM_ADMIN');
        }
        if (roleName === 'SUPER_ADMIN') {
            permissions.push('IDENTITY:IS_SUPER_ADMIN');
            permissions.push('IDENTITY:IS_MANAGEMENT');
        }
        if (roleName === 'MANAGEMENT') {
            permissions.push('IDENTITY:IS_MANAGEMENT');
        }
        if (roleName === 'Teacher' || roleName === 'TEACHER') {
            permissions.push('IDENTITY:IS_TEACHER');
            permissions.push('TEACHER_DASHBOARD_ACCESS:READ');
        }
        if (roleName === 'Student' || roleName === 'STUDENT') {
            permissions.push('IDENTITY:IS_STUDENT');
            permissions.push('STUDENT_DASHBOARD_ACCESS:READ');
        }
        const verificationAssignments = await prisma_1.default.skillVerificationAssignment.findMany({
            where: { verifier_ids: { has: user.id } }
        });
        if (verificationAssignments.length > 0) {
            permissions.push('IDENTITY:IS_SKILL_VERIFIER');
        }
        const token = jsonwebtoken_1.default.sign({
            user_id: user.id,
            organization_id: user.organization_id,
            role: user.role.name
        }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                permissions,
                is_active: user.is_active
            },
            organization: {
                id: user.organization.id,
                school_name: user.organization.school_name,
                logo_url: user.organization.logo_url
            }
        });
    }
    catch (error) {
        console.error("Login Error: ", error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.issues
            });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/me', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user?.user_id },
            include: {
                organization: true,
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const permissions = user.role.permissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`);
        const roleName = user.role.name || '';
        if (roleName === 'SYSTEM_ADMIN') {
            permissions.push('IDENTITY:IS_SYSTEM_ADMIN');
        }
        if (roleName === 'SUPER_ADMIN') {
            permissions.push('IDENTITY:IS_SUPER_ADMIN');
            permissions.push('IDENTITY:IS_MANAGEMENT');
        }
        if (roleName === 'MANAGEMENT') {
            permissions.push('IDENTITY:IS_MANAGEMENT');
        }
        if (roleName === 'Teacher' || roleName === 'TEACHER') {
            permissions.push('IDENTITY:IS_TEACHER');
            permissions.push('TEACHER_DASHBOARD_ACCESS:READ');
        }
        if (roleName === 'Student' || roleName === 'STUDENT') {
            permissions.push('IDENTITY:IS_STUDENT');
            permissions.push('STUDENT_DASHBOARD_ACCESS:READ');
        }
        const verificationAssignments = await prisma_1.default.skillVerificationAssignment.findMany({
            where: { verifier_ids: { has: user.id } }
        });
        if (verificationAssignments.length > 0) {
            permissions.push('IDENTITY:IS_SKILL_VERIFIER');
        }
        res.json({
            user_id: user.id,
            role: user.role.name,
            organization_id: user.organization_id,
            permissions
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/logout', async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});
const changePasswordSchema = zod_1.z.object({
    old_password: zod_1.z.string().min(1),
    new_password: zod_1.z.string().min(6)
});
router.post('/change-password', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const parsed = changePasswordSchema.parse(req.body);
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user?.user_id } });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const isMatch = await bcrypt_1.default.compare(parsed.old_password, user.password_hash);
        if (!isMatch)
            return res.status(400).json({ message: 'Incorrect old password' });
        const password_hash = await bcrypt_1.default.hash(parsed.new_password, 10);
        await prisma_1.default.user.update({ where: { id: user.id }, data: { password_hash } });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.issues });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
const resetRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    frontendOrigin: zod_1.z.string().url()
});
router.post('/forgot-password', async (req, res) => {
    try {
        const parsed = resetRequestSchema.parse(req.body);
        const user = await prisma_1.default.user.findFirst({
            where: { email: parsed.email },
            include: { organization: true }
        });
        if (!user) {
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await prisma_1.default.passwordReset.create({
            data: { user_id: user.id, token, expires_at }
        });
        const frontendOrigin = parsed.frontendOrigin;
        const resetUrl = email_link_builder_service_1.EmailLinkBuilder.buildPasswordResetUrl(user.organization, token, frontendOrigin);
        await email_service_1.EmailService.sendPasswordResetEmail(user.name, user.email, resetUrl);
        res.json({ message: 'If the email exists, a reset link has been sent' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.issues });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    new_password: zod_1.z.string().min(6)
});
router.post('/reset-password', async (req, res) => {
    try {
        const parsed = resetPasswordSchema.parse(req.body);
        const resetEntry = await prisma_1.default.passwordReset.findUnique({ where: { token: parsed.token } });
        if (!resetEntry || resetEntry.used || resetEntry.expires_at < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        const password_hash = await bcrypt_1.default.hash(parsed.new_password, 10);
        await prisma_1.default.$transaction([
            prisma_1.default.user.update({ where: { id: resetEntry.user_id }, data: { password_hash } }),
            prisma_1.default.passwordReset.update({ where: { id: resetEntry.id }, data: { used: true } })
        ]);
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.issues });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
