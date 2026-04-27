import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

// Configure Multer for Logo Uploads
const storage = multer.diskStorage({
  destination: 'uploads/logos/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Ensure upload directory exists (Helper)
const fs = require('fs');
if (!fs.existsSync('uploads/logos/')) {
  fs.mkdirSync('uploads/logos/', { recursive: true });
}

router.post('/upload-logo', authMiddleware, upload.single('logo'), (req: any, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  res.json({ logoUrl });
});

router.get('/debug-db', async (req, res) => {
  const orgs = await prisma.organization.findMany();
  res.json({ orgs });
});

router.use(authMiddleware);
router.use(authorizeRoles('SYSTEM_ADMIN'));

// 1. Check Subdomain Availability
router.get('/check-subdomain', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Query required' });
  
  const existing = await prisma.organization.findUnique({ where: { subdomain: q as string } });
  res.json({ available: !existing });
});

// 3.5 Get My Organization License (For Super Admin Dashboard)
router.get('/me/license', authMiddleware, authorizeRoles('SUPER_ADMIN', 'SYSTEM_ADMIN'), async (req: any, res: Response) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organization_id },
      include: { 
        license: true,
        _count: { select: { users: { where: { is_active: true } } } }
      }
    });

    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const license = org.license;
    const activeUsers = org._count.users;
    const limit = license?.licensed_seats || org.login_limit || 100;
    const usagePercent = Math.round((activeUsers / limit) * 100);

    res.json({
      school_name: org.school_name,
      limit,
      activeUsers,
      usagePercent,
      renewal_date: license?.renewal_date,
      status: license?.status || 'ACTIVE',
      warning_threshold: license?.warning_threshold || 80
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch license info' });
  }
});

/**
 * GET /api/organizations/me/profile
 * Get full profile of current organization
 */
router.get('/me/profile', authMiddleware, async (req: any, res: Response) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organization_id }
    });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Get Platform Statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.organization.count();
    const active = await prisma.organization.count({ where: { backup_enabled: true } }); // Example: using backup_enabled as a proxy for 'active' status for now
    const recent = await prisma.organization.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: { id: true, school_name: true, subdomain: true, created_at: true }
    });

    res.json({ total, active, suspended: 0, trial: 0, recent });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// 5. Get Single Organization Details
router.get('/:id', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { users: true } },
        users: {
          where: { role: { name: 'SUPER_ADMIN' } },
          take: 1
        }
      }
    });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 6. Update Organization Status (Lifecycle)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // Expecting OrganizationStatus enum value
    
    // Safety check: Prevent suspending/archiving platform core
    const target = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (target?.subdomain === 'sys' && (status === 'SUSPENDED' || status === 'ARCHIVED')) {
      return res.status(403).json({ message: 'Platform Core organization cannot be suspended or archived' });
    }

    const updated = await prisma.organization.update({
      where: { id: req.params.id },
      data: { status: status }
    });
    
    res.json({ 
      message: `Organization status updated to ${status}`,
      status: updated.status 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// 7. Impersonate Tenant Admin (Enhanced)
router.post('/:id/impersonate', async (req: any, res: Response) => {
  try {
    const orgId = req.params.id;
    const adminUserId = req.user.user_id; // The System Admin's ID
    
    // Find the first Super Admin for this organization
    const adminUser = await prisma.user.findFirst({
      where: { 
        organization_id: orgId,
        role: { name: 'SUPER_ADMIN' },
        is_active: true
      },
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

    if (!adminUser) {
      return res.status(404).json({ message: 'No active Super Admin found for this tenant' });
    }

    const permissions = adminUser.role.permissions.map((rp: any) => `${rp.permission.module}:${rp.permission.action}`);

    // Generate impersonation token with return context
    const token = jwt.sign(
      { 
        user_id: adminUser.id, 
        organization_id: adminUser.organization_id,
        is_impersonation: true,
        original_user_id: adminUserId, // Context for returning
        impersonated_at: new Date()
      },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '2h' }
    );

    res.json({
      token,
      is_impersonation: true,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role.name,
        permissions,
        is_active: adminUser.is_active
      },
      organization: {
        id: adminUser.organization.id,
        school_name: adminUser.organization.school_name,
        logo_url: adminUser.organization.logo_url
      }
    });
  } catch (error) {
    console.error('[IMPERSONATE ERROR]', error);
    res.status(500).json({ message: 'Impersonation failed' });
  }
});

// 2. Test SMTP Connection
router.post('/test-smtp', async (req, res) => {
  const { smtp_host, smtp_port, smtp_email, smtp_password } = req.body;
  if (!smtp_host || !smtp_email) return res.status(400).json({ message: 'Host and email required' });

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtp_host,
    port: Number(smtp_port),
    secure: Number(smtp_port) === 465,
    auth: { user: smtp_email, pass: smtp_password }
  });

  try {
    await transporter.verify();
    res.json({ success: true, message: 'SMTP Connection Successful' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: `SMTP Error: ${error.message}` });
  }
});

// 3. Pre-flight Provisioning Validation
router.post('/validate-provisioning', async (req, res) => {
  try {
    const { subdomain, admin_email, model } = req.body;
    const checks = {
      subdomainAvailable: true,
      adminEmailAvailable: true,
      errors: [] as string[]
    };

    if (subdomain && model === 'SaaS') {
      const org = await prisma.organization.findUnique({ where: { subdomain } });
      if (org) {
        checks.subdomainAvailable = false;
        checks.errors.push(`Subdomain '${subdomain}' is taken`);
      }
    }

    if (admin_email) {
      const user = await prisma.user.findFirst({ where: { email: admin_email } });
      if (user) {
        checks.adminEmailAvailable = false;
        checks.errors.push(`Admin email '${admin_email}' is already registered`);
      }
    }

    console.log('[DEBUG] Provisioning validation:', { subdomain, model, checks });

    res.json({
      ready: checks.errors.length === 0,
      ...checks
    });
  } catch (error) {
    res.status(500).json({ message: 'Validation failed' });
  }
});

const orgSchema = z.object({
  // Core
  school_name: z.string().nullish().or(z.literal('')),
  school_type: z.string().nullish(),
  medium: z.string().nullish(),
  // Contact
  contact_email: z.string().email().nullish().or(z.literal('')),
  contact_phone: z.string().nullish(),
  address: z.string().nullish(),
  logo_url: z.string().url().nullish().or(z.literal('')),
  // Domain
  domain_type: z.enum(['subdomain', 'custom', 'on_premise']).default('subdomain'),
  subdomain: z.string().nullish().or(z.literal('')),
  custom_domain: z.string().nullish(),
  // SMTP
  smtp_host: z.string().nullish(),
  smtp_port: z.number().nullish(),
  smtp_email: z.string().email().nullish().or(z.literal('')),
  smtp_password: z.string().nullish(),
  // Settings
  backup_enabled: z.boolean().default(false),
  // License Config
  licensed_seats: z.coerce.number().min(1).default(100),
  renewal_date: z.string().nullish().or(z.literal('')),
  grace_period_days: z.coerce.number().min(0).default(7),
  warning_threshold: z.coerce.number().min(50).max(100).default(80),
  internal_notes: z.string().nullish(),
  // Admin (ignored at creation, kept for future use)
  admin_name: z.string().nullish().or(z.literal('')),
  admin_email: z.string().nullish().or(z.literal('')),
  admin_password: z.string().nullish().or(z.literal('')),
});

// Helper to recursively or flat-clean object values: "" and undefined -> null
function cleanInput(data: any): any {
  const cleaned: any = {};
  for (const key in data) {
    if (data[key] === '' || data[key] === undefined) {
      cleaned[key] = null;
    } else if (typeof data[key] === 'string') {
      cleaned[key] = data[key].trim() || null;
    } else {
      cleaned[key] = data[key];
    }
  }
  return cleaned;
}

router.post('/', async (req: any, res: Response) => {
  try {
    console.log('[ORG CREATE RAW BODY]', req.body);
    
    // Clean strings before schema parse and db insertion
    const cleanedBody = cleanInput(req.body);
    const parsed = orgSchema.parse(cleanedBody);
    console.log('[DEBUG] Schema parsed successfully:', parsed);

    // Check subdomain uniqueness only if properly provided
    if (parsed.subdomain) {
      console.log(`[DEBUG] Checking uniqueness for subdomain: ${parsed.subdomain}`);
      const existingOrg = await prisma.organization.findUnique({ where: { subdomain: parsed.subdomain } });
      if (existingOrg) {
        return res.status(400).json({ message: `Subdomain '${parsed.subdomain}' is already in use by '${existingOrg.school_name}'. Choose another.` });
      }
    }

    console.log('[DEBUG] Proceeding to create organization and admin user...');

    // Wrap org + admin user creation in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create the organization
      const org = await tx.organization.create({
        data: {
          school_name:   parsed.school_name   || 'Unnamed School',
          school_type:   parsed.school_type   || null,
          medium:        parsed.medium        || null,
          contact_email: parsed.contact_email || null,
          contact_phone: parsed.contact_phone || null,
          address:       parsed.address       || null,
          logo_url:      parsed.logo_url      || null,
          domain_type:   parsed.domain_type   || 'subdomain',
          subdomain:     parsed.subdomain     || null,
          custom_domain: parsed.custom_domain || null,
          smtp_host:     parsed.smtp_host     || null,
          smtp_port:     parsed.smtp_port     ? Number(parsed.smtp_port) : null,
          smtp_email:    parsed.smtp_email    || null,
          smtp_password: parsed.smtp_password || null,
          backup_enabled: parsed.backup_enabled === true,
          login_limit:   Number(parsed.licensed_seats) || 100, // Legacy support
        }
      });

      // 1.5 Create the Organization License
      await tx.organizationLicense.create({
        data: {
          organization_id: org.id,
          licensed_seats:  Number(parsed.licensed_seats)  || 100,
          renewal_date:    parsed.renewal_date ? new Date(parsed.renewal_date) : null,
          grace_period_days: Number(parsed.grace_period_days) || 7,
          warning_threshold: Number(parsed.warning_threshold) || 80,
          internal_notes:  parsed.internal_notes || null,
          status: 'ACTIVE'
        }
      });

      // 2. Create SUPER_ADMIN user if admin credentials were provided
      let adminUser = null;
      if (parsed.admin_email && parsed.admin_password) {
        // Check email is not already taken globally
        const emailTaken = await tx.user.findFirst({ where: { email: parsed.admin_email } });
        if (emailTaken) {
          throw new Error(`ADMIN_EMAIL_CONFLICT:The email '${parsed.admin_email}' is already registered in the platform. Use a different email for this school's admin.`);
        }

        // Find the system-wide SUPER_ADMIN role
        const superAdminRole = await tx.role.findFirst({ where: { name: 'SUPER_ADMIN', is_system: true } });
        if (!superAdminRole) {
          throw new Error('ROLE_MISSING:SUPER_ADMIN role not found in system. Please contact support.');
        }

        const bcrypt = require('bcrypt');
        const password_hash = await bcrypt.hash(parsed.admin_password, 10);

        adminUser = await tx.user.create({
          data: {
            name:            parsed.admin_name || 'School Admin',
            email:           parsed.admin_email,
            password_hash,
            role_id:         superAdminRole.id,
            organization_id: org.id,
            is_active:       true,
          }
        });
      }

      return { org, adminUser };
    });

    res.status(201).json({
      message: 'Organization provisioned successfully',
      organizationId: result.org.id,
      adminCreated: !!result.adminUser,
      adminEmail: result.adminUser?.email || null,
    });
  } catch (error: any) {
    console.error('[ORG CREATE ERROR LOG]', error);
    if (error?.errors) {
      console.error('[ZOD ERRORS]', JSON.stringify(error.errors, null, 2));
    }

    // Handle custom business logic errors thrown from inside the transaction
    if (typeof error?.message === 'string' && error.message.includes(':')) {
      const [code, msg] = error.message.split(/:(.+)/);
      if (code === 'ADMIN_EMAIL_CONFLICT' || code === 'ROLE_MISSING') {
        return res.status(400).json({ message: msg?.trim() || error.message });
      }
    }

    // Handle Zod validation errors
    if (error?.errors) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors,
        details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }

    // Handle Prisma unique constraint error
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: `A conflict occurred: The ${error.meta?.target?.join(', ') || 'field'} is already in use. Choose another.` });
    }

    res.status(500).json({ message: error?.message || 'Internal server error' });
  }
});


// GET all organizations (IT Setup only)
router.get('/', async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      subdomain: { not: 'sys' } // Hide Management Tenant from general inventory
    };
    
    if (search) {
      where.AND = [
        { subdomain: { not: 'sys' } },
        {
          OR: [
            { school_name: { contains: search as string, mode: 'insensitive' } },
            { subdomain: { contains: search as string, mode: 'insensitive' } }
          ]
        }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [orgs, total] = await prisma.$transaction([
      prisma.organization.findMany({
        where,
        select: {
          id: true, school_name: true, school_type: true, subdomain: true,
          contact_email: true, login_limit: true, backup_enabled: true, created_at: true,
          status: true,
          _count: { select: { users: true } },
          users: {
            where: { role: { name: 'SUPER_ADMIN' } },
            take: 1,
            select: { email: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.organization.count({ where })
    ]);

    res.json({
      data: orgs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[GET ORGS ERROR]', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH - allow school admin to update their own org branding
router.patch('/:id/branding', authMiddleware, async (req: any, res: Response) => {
  try {
    const { school_name, logo_url, contact_email, contact_phone, address } = req.body;
    // Only allow SUPER_ADMIN of the org or SYSTEM_ADMIN
    const isSelf = req.user.role === 'SUPER_ADMIN' && req.user.organization_id === req.params.id;
    const isIT = req.user.role === 'SYSTEM_ADMIN';
    if (!isSelf && !isIT) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.organization.update({
      where: { id: req.params.id },
      data: { school_name, logo_url, contact_email, contact_phone, address }
    });
    res.json({ message: 'Branding updated', organization: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE organization (IT Setup only)
router.delete('/:id', async (req: any, res: Response) => {
  try {
    await prisma.organization.delete({ where: { id: req.params.id } });
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
