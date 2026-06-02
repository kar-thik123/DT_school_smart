"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
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
        const isMatch = await bcrypt_1.default.compare(parsed.password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
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
                return res.status(403).json({ message: 'Please log in through your organization\'s assigned domain.' });
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
        const token = jsonwebtoken_1.default.sign({
            user_id: user.id,
            organization_id: user.organization_id
        }, process.env.JWT_SECRET || 'supersecret_jwt_key_for_dev_only', { expiresIn: '1d' });
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
    email: zod_1.z.string().email()
});
router.post('/forgot-password', async (req, res) => {
    try {
        const parsed = resetRequestSchema.parse(req.body);
        const user = await prisma_1.default.user.findFirst({
            where: { email: parsed.email }
        });
        if (!user) {
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await prisma_1.default.passwordReset.create({
            data: { user_id: user.id, token, expires_at }
        });
        const baseUrl = process.env.FRONTEND_URL || 'https://app.platform.com';
        const resetUrl = `${baseUrl}/#/authentication/reset-password?token=${token}`;
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL || 'sam21cs1188@gmail.com',
                pass: process.env.SMTP_PASSWORD || 'mggc wifs yaas yika'
            }
        });
        await transporter.sendMail({
            from: `"School Support" <${process.env.SMTP_EMAIL || 'sam21cs1188@gmail.com'}>`,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">Reset Your Password</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password. Click the secure link below to proceed:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; color:#ffffff; background-color:#10b981; border-radius:8px; text-decoration:none; font-weight:bold;">Set New Password</a>
          </div>
          <p style="font-size:14px; color:#666;">This link is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
        });
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
