import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import prisma from '../prisma';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many login attempts, please try again later'
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/login', loginLimiter, async (req: any, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
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

    const isMatch = await bcrypt.compare(parsed.password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const permissions = user.role.permissions.map((rp: any) => `${rp.permission.module}:${rp.permission.action}`);

    const token = jwt.sign(
      { 
        user_id: user.id, 
        organization_id: user.organization_id
      },
      process.env.JWT_SECRET || 'supersecret_jwt_key_for_dev_only',
      { expiresIn: '1d' }
    );

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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.issues
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
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
    if (!user) return res.status(404).json({ message: 'User not found' });

    const permissions = user.role.permissions.map((rp: any) => `${rp.permission.module}:${rp.permission.action}`);

    res.json({
      user_id: user.id,
      role: user.role.name,
      organization_id: user.organization_id,
      permissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const changePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(6)
});

router.post('/change-password', authMiddleware, async (req: any, res: Response) => {
  try {
    const parsed = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user?.user_id } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(parsed.old_password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

    const password_hash = await bcrypt.hash(parsed.new_password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash } });

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

const resetRequestSchema = z.object({
  email: z.string().email()
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const parsed = resetRequestSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: { email: parsed.email }
    });

    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const token = randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.passwordReset.create({
      data: { user_id: user.id, token, expires_at }
    });

    const resetUrl = `http://localhost:4200/#/authentication/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

const resetPasswordSchema = z.object({
  token: z.string(),
  new_password: z.string().min(6)
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordSchema.parse(req.body);
    const resetEntry = await prisma.passwordReset.findUnique({ where: { token: parsed.token } });

    if (!resetEntry || resetEntry.used || resetEntry.expires_at < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const password_hash = await bcrypt.hash(parsed.new_password, 10);
    
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetEntry.user_id }, data: { password_hash } }),
      prisma.passwordReset.update({ where: { id: resetEntry.id }, data: { used: true } })
    ]);

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
