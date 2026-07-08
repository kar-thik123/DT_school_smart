import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { EmailLinkBuilder } from '../services/email-link-builder.service';
import { EmailService } from '../services/email.service';
import { checkSeatAvailability } from '../utils/license-check';
import multer = require('multer');
import path = require('path');
import fs = require('fs');
import { AuthorizationService } from '../services/authorization.service';
import { processImage } from '../utils/image-compression.util';
import { NotificationService } from '../services/notification.service';
import { stringify } from 'csv-stringify';
import { logAuditEvent } from '../services/audit.service';
import { CreateUserSchema, AdminUpdateSchema, ProfileUpdateSchema, UserValidationService, AppValidationError } from '../services/user-validation.service';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
router.use(authMiddleware);

const requireManagement = requirePermission('IDENTITY', 'IS_MANAGEMENT');



// GET all teachers in org — only users whose role has IS_TEACHER but NOT IS_MANAGEMENT or IS_STUDENT
router.get('/teachers', async (req: any, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all users in org
router.get('/', async (req: any, res: Response) => {
  try {
    // Custom permission check since requireManagement is too strict for skills assigners
    const permissions = req.user?.permissions || [];
    const hasManagement = AuthorizationService.hasPermission(permissions, 'IDENTITY', 'IS_MANAGEMENT');
    const hasSkillAccess = AuthorizationService.hasPermission(permissions, 'SKILLS_VERIFICATION', 'VIEW') ||
      AuthorizationService.hasPermission(permissions, 'SKILLS_VERIFY_ASSIGNMENT', 'VIEW') ||
      AuthorizationService.hasPermission(permissions, 'SKILLS_VERIFY_ASSIGNMENT', 'ASSIGN') ||
      AuthorizationService.hasPermission(permissions, 'IDENTITY', 'IS_SKILL_VERIFIER');

    if (!hasManagement && !hasSkillAccess) {
      return res.status(403).json({ message: 'Forbidden: Requires IS_MANAGEMENT or SKILLS_VERIFICATION permissions' });
    }

    const filter: any = { organization_id: req.user.organization_id };
    if (req.query.grade_id) {
      filter.grade_id = String(req.query.grade_id);
    }
    if (req.query.section_id) {
      filter.section_id = String(req.query.section_id);
    }
    if (req.query.role) {
      // Allow searching by role name dynamically without hardcoding
      const roleRecords = await prisma.role.findMany({
        where: {
          name: String(req.query.role),
          OR: [
            { organization_id: req.user.organization_id },
            { is_system: true }
          ]
        }
      });
      if (roleRecords.length > 0) {
        filter.role_id = { in: roleRecords.map((r: any) => r.id) };
      }
    }
    console.log('[GET /api/users] filter:', JSON.stringify(filter));
    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true, name: true, email: true, section_id: true, grade_id: true, role_id: true, roll_number: true,
        role: { select: { name: true } },
        grade: { select: { name: true } },
        section: { select: { name: true } },
        is_active: true, created_at: true
      },
      orderBy: { name: 'asc' }
    });
    console.log('[GET /api/users] returned:', users.length, 'users');
    res.json(users.map((u: any) => ({
      ...u,
      role: u.role?.name,
      grade_name: u.grade?.name || null,
      section_name: u.section?.name || null
    })));
  } catch (error: any) {
    console.error('[GET /api/users] ERROR:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET export users to CSV
router.get('/export', requirePermission('USERS', 'EXPORT'), async (req: any, res: Response) => {
  try {
    const userCount = await prisma.user.count({
      where: { organization_id: req.user.organization_id }
    });

    const isTemplateOnly = userCount === 0;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users_${isTemplateOnly ? 'template' : 'export'}.csv"`);

    const stringifier = stringify({
      header: true,
      columns: ['Name', 'Email Address', 'Mobile Number', 'Role', 'Roll Number', 'Password']
    });

    stringifier.pipe(res);

    let totalExported = 0;

    if (!isTemplateOnly) {
      let cursor: string | undefined = undefined;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const batchUsers: any[] = await prisma.user.findMany({
          take: batchSize,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          where: { organization_id: req.user.organization_id },
          include: {
            role: true,
            student_profile: true,
            enrollments: {
              take: 1,
              orderBy: { enrollment_date: 'desc' }
            }
          },
          orderBy: { id: 'asc' }
        });

        if (batchUsers.length === 0) {
          hasMore = false;
          break;
        }

        for (const u of batchUsers) {
          stringifier.write([
            u.name,
            u.email,
            u.student_profile?.mobile_number || '',
            u.role?.name || '',
            u.roll_number || u.enrollments?.[0]?.roll_number || '',
            '' // Password column must remain blank
          ]);
          totalExported++;
        }

        if (batchUsers.length < batchSize) {
          hasMore = false;
        } else {
          cursor = batchUsers[batchUsers.length - 1].id;
        }
      }
    }

    stringifier.end();

    await logAuditEvent({
      organization_id: req.user.organization_id,
      user_id: req.user.user_id,
      user_name: req.user.name,
      action_type: 'EXPORT' as any,
      entity_type: 'USER' as any,
      entity_id: 'BULK_EXPORT',
      metadata: { entity_type: 'USER', is_template: isTemplateOnly, totalExported }
    });

  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'Failed to export users' });
  }
});

// POST create single user
router.post('/', requireManagement, async (req: any, res: Response) => {
  try {
    const parsed = CreateUserSchema.parse(req.body);
    console.log('[POST /api/users] body:', JSON.stringify(req.body));
    console.log('[POST /api/users] parsed:', JSON.stringify(parsed));
    const org = await prisma.organization.findUnique({ where: { id: req.user.organization_id } });
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // Check license seat availability
    const licenseCheck = await checkSeatAvailability(req.user.organization_id, 1);
    if (!licenseCheck.allowed) {
      return res.status(403).json({
        message: licenseCheck.message,
        code: 'LICENSE_LIMIT_REACHED',
        usage: licenseCheck.usagePercent
      });
    }

    // Standardized DB unique checks
    await UserValidationService.checkGlobalEmailUnique(parsed.email);
    await UserValidationService.checkTenantIdentifiersUnique(
      req.user.organization_id, 
      parsed.admission_number, 
      parsed.mobile_number
    );

    const password_hash = await bcrypt.hash(parsed.password, 10);
    const roleDb = await prisma.role.findFirst({
      where: {
        id: parsed.role_id,
        OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
      }
    });
    if (!roleDb) return res.status(400).json({ message: 'Role not found' });

    // Validate section belongs to grade if both provided
    if (parsed.section_id && parsed.grade_id) {
      const section = await prisma.section.findFirst({
        where: { id: parsed.section_id, grade_id: parsed.grade_id, organization_id: req.user.organization_id }
      });
      if (!section) return res.status(400).json({ message: 'Selected section does not belong to the selected grade' });
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password_hash,
        role_id: parsed.role_id,
        organization_id: req.user.organization_id,
        grade_id: parsed.grade_id || null,
        section_id: parsed.section_id || null,
        roll_number: parsed.roll_number || null
      }
    });

    // Check if role has IDENTITY:IS_STUDENT
    const isStudent = await prisma.rolePermission.findFirst({
      where: {
        role_id: parsed.role_id,
        permission: { module: 'IDENTITY', action: 'IS_STUDENT' }
      }
    });

    if (isStudent && (parsed.admission_number || parsed.mobile_number)) {
      await prisma.studentProfile.create({
        data: {
          user_id: user.id,
          organization_id: req.user.organization_id,
          admission_number: parsed.admission_number || null,
          mobile_number: parsed.mobile_number || null
        }
      });
    }

    await NotificationService.sendNotification({
      organization_id: req.user.organization_id,
      event_type: 'USER_MANAGEMENT',
      entity_type: 'USER',
      entity_id: user.id,
      title: 'Welcome to the Platform',
      message: `Your account has been successfully created.`,
      context_data: { icon: 'user', color: 'notification-green' },
      recipient_ids: [user.id]
    });

    // Explicit return to prevent ERR_HTTP_HEADERS_SENT
    return res.status(201).json({ message: 'User created', user: { id: user.id, name: user.name, email: user.email, role_id: parsed.role_id } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.issues
      });
    }
    // Handle specific DB conflict errors thrown by UserValidationService
    if (error instanceof AppValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('[POST /api/users] Error:', error.stack || error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// // POST bulk import users via JSON array
// router.post('/bulk', requireManagement, async (req: any, res: Response) => {
//   try {
//     const users: Array<{ name: string; email: string; password?: string; role_id?: string; role?: string; grade_id?: string; section_id?: string; admission_number?: string; mobile_number?: string }> = req.body.users;
//     if (!users || !Array.isArray(users) || users.length === 0) {
//       return res.status(400).json({ message: 'No users provided' });
//     }

//     const org = await prisma.organization.findUnique({ where: { id: req.user.organization_id } });
//     if (!org) return res.status(404).json({ message: 'Organization not found' });

//     // Check license seat availability for bulk
//     const licenseCheck = await checkSeatAvailability(req.user.organization_id, users.length);
//     if (!licenseCheck.allowed) {
//       return res.status(403).json({
//         message: licenseCheck.message,
//         code: 'LICENSE_LIMIT_REACHED',
//         usage: licenseCheck.usagePercent
//       });
//     }

//     const results = { created: 0, skipped: 0, errors: [] as string[] };
//     for (const u of users) {
//       try {
//         // Global email uniqueness check
//         const existing = await prisma.user.findUnique({ where: { email: u.email } });
//         if (existing) { results.skipped++; results.errors.push(`${u.email}: already registered in platform`); continue; }
//         let roleId = u.role_id;

//         if (!roleId && u.role) {
//           // Dynamic fallback by name if string is provided
//           const roleDb = await prisma.role.findFirst({
//             where: {
//               name: { equals: u.role, mode: 'insensitive' },
//               OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
//             }
//           });
//           if (roleDb) roleId = roleDb.id;
//         }

//         if (!roleId) {
//           // Ultimate fallback to ANY IS_STUDENT role
//           const studentRole = await prisma.role.findFirst({
//             where: {
//               permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } } },
//               OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
//             }
//           });
//           if (studentRole) roleId = studentRole.id;
//         }

//         if (!roleId) { results.skipped++; results.errors.push(`${u.email}: valid role could not be resolved`); continue; }

//         const password_hash = await bcrypt.hash(u.password || 'changeme123', 10);
//         const newUser = await prisma.user.create({
//           data: { name: u.name, email: u.email, password_hash, role_id: roleId, organization_id: req.user.organization_id, grade_id: u.grade_id || null, section_id: u.section_id || null }
//         });

//         // Check if student
//         const isStudent = await prisma.rolePermission.findFirst({
//           where: { role_id: roleId, permission: { module: 'IDENTITY', action: 'IS_STUDENT' } }
//         });

//         if (isStudent && (u.admission_number || u.mobile_number)) {
//           await prisma.studentProfile.create({
//             data: {
//               user_id: newUser.id,
//               organization_id: req.user.organization_id,
//               admission_number: u.admission_number || null,
//               mobile_number: u.mobile_number || null
//             }
//           });
//         }
//         results.created++;
//       } catch (e) {
//         results.errors.push(`${u.email}: failed`);
//         results.skipped++;
//       }
//     }
//     res.status(201).json({ message: 'Bulk import complete', ...results });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// PUT update user by id
router.put('/:id', requireManagement, async (req: any, res: Response) => {
  try {
    // Parse using the schema (which is now inherently partial)
    const parsed = AdminUpdateSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id },
      include: { role: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Self-protection: SUPER_ADMIN cannot demote or mutate their own owner account
    if (user.role?.name === 'SUPER_ADMIN' && user.id === req.user.user_id) {
      // Allow safe edits (name) but block role changes or deactivation
      if (parsed.role_id || parsed.role || parsed.is_active === false) {
        return res.status(403).json({ message: 'Tenant owner account cannot perform self-destructive actions.' });
      }
    }

    let updateData: any = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.is_active !== undefined) updateData.is_active = parsed.is_active;

    if (parsed.email && parsed.email !== user.email) {
      await UserValidationService.checkGlobalEmailUnique(parsed.email, req.params.id);
      updateData.email = parsed.email;
    }

    if (parsed.role_id) {
      const roleDb = await prisma.role.findFirst({
        where: {
          id: parsed.role_id,
          OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
        }
      });
      if (roleDb) updateData.role_id = roleDb.id;
    } else if (parsed.role) {
      // Legacy support for string updates if any still exist
      const roleDb = await prisma.role.findFirst({
        where: { name: parsed.role, OR: [{ organization_id: req.user.organization_id }, { is_system: true }] }
      });
      if (roleDb) updateData.role_id = roleDb.id;
    }

    if (parsed.roll_number !== undefined) {
      updateData.roll_number = parsed.roll_number === '' ? null : parsed.roll_number;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { role: true }
    });

    if (updateData.role_id && updateData.role_id !== user.role_id) {
      await NotificationService.sendNotification({
        organization_id: req.user.organization_id,
        event_type: 'USER_MANAGEMENT',
        entity_type: 'USER',
        entity_id: updated.id,
        title: 'Role Updated',
        message: `Your role has been updated to ${updated.role.name}.`,
        context_data: { icon: 'shield', color: 'notification-blue' },
        recipient_ids: [updated.id]
      });
    }

    res.json({ message: 'User updated', user: { ...updated, role: updated.role.name } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.issues
      });
    }
    if (error instanceof AppValidationError) {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('[PUT /api/users/:id] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH status
router.patch('/:id/status', requireManagement, async (req: any, res: Response) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active must be a boolean' });
    }
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id },
      include: { role: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Self-protection: SUPER_ADMIN cannot deactivate themselves
    if (user.role?.name === 'SUPER_ADMIN' && user.id === req.user.user_id) {
      return res.status(403).json({ message: 'Tenant owner account cannot perform self-destructive actions.' });
    }

    await prisma.user.update({ where: { id: req.params.id }, data: { is_active } });

    await NotificationService.sendNotification({
      organization_id: req.user.organization_id,
      event_type: 'USER_MANAGEMENT',
      entity_type: 'USER',
      entity_id: user.id,
      title: `Account ${is_active ? 'Activated' : 'Deactivated'}`,
      message: `Your account has been ${is_active ? 'activated' : 'deactivated'} by an administrator.`,
      context_data: { icon: is_active ? 'check-circle' : 'slash', color: is_active ? 'notification-green' : 'notification-red' },
      recipient_ids: [user.id]
    });

    res.json({ message: `User ${is_active ? 'activated' : 'deactivated'}` });
  } catch (error: any) {
    if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('User status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE user
router.delete('/:id', requireManagement, async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id },
      include: { role: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Self-protection: SUPER_ADMIN cannot delete themselves — would orphan the tenant
    if (user.role?.name === 'SUPER_ADMIN' && user.id === req.user.user_id) {
      return res.status(403).json({ message: 'Tenant owner account cannot perform self-destructive actions.' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('User delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST admin-triggered reset password link
router.post('/:id/reset-password', requireManagement, async (req: any, res: Response) => {
  try {
    const targetUser = await prisma.user.findFirst({
      where: { id: req.params.id, organization_id: req.user.organization_id },
      include: { role: true, organization: true }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Role restriction check: Protect SYSTEM_ADMIN from being reset by standard tenant admins
    const isSystemAdmin = AuthorizationService.hasIdentity(req.user.permissions || [], 'IS_SYSTEM_ADMIN');
    if (targetUser.role?.name === 'SYSTEM_ADMIN' && !isSystemAdmin) {
      return res.status(403).json({ message: 'Cannot reset password for SYSTEM_ADMIN' });
    }

    // Self-protection: SUPER_ADMIN cannot admin-reset their own password via user management
    // (they should use the standard forgot-password flow instead)
    if (targetUser.role?.name === 'SUPER_ADMIN' && targetUser.id === req.user.user_id) {
      return res.status(403).json({ message: 'Tenant owner account cannot perform self-destructive actions.' });
    }

    const { randomBytes } = require('crypto');

    const token = randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Existing token cleanup
    await prisma.passwordReset.deleteMany({
      where: { user_id: targetUser.id, used: false }
    });

    await prisma.passwordReset.create({
      data: { user_id: targetUser.id, token, expires_at }
    });

    const frontendOrigin = req.body.frontendOrigin;
    if (!frontendOrigin) {
      return res.status(400).json({ message: 'frontendOrigin is required' });
    }
    const resetUrl = EmailLinkBuilder.buildPasswordResetUrl(targetUser.organization, token, frontendOrigin);

    try {
      await EmailService.sendAdminPasswordResetEmail(targetUser.name, targetUser.email, resetUrl);

      await NotificationService.sendNotification({
        organization_id: req.user.organization_id,
        event_type: 'USER_MANAGEMENT',
        entity_type: 'USER',
        entity_id: targetUser.id,
        title: `Password Reset Requested`,
        message: `A password reset link has been sent to your email.`,
        context_data: { icon: 'lock', color: 'notification-orange' },
        recipient_ids: [targetUser.id]
      });

      res.json({ message: 'Password reset link sent to user email' });
    } catch (emailError: any) {
      console.error('[SMTP Error] Failed to send email:', emailError.message);
      // Even if email fails, we might want to return 500 so the frontend knows it failed
      return res.status(500).json({ message: 'Failed to dispatch email. Check SMTP configuration.' });
    }

  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
})

router.get('/me/subjects', async (req: any, res: Response) => {
  try {
    const userId = req.user.user_id;
    const organizationId = req.user.organization_id;

    // Check if the user is a student by getting their enrollments
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { student_id: userId, organization_id: organizationId },
      orderBy: { enrollment_date: 'desc' },
      take: 1
    });

    if (enrollments.length > 0) {
      // User is a student, fetch subjects for their grade
      const subjects = await prisma.subject.findMany({
        where: {
          grade_id: enrollments[0].grade_id,
          organization_id: organizationId,
          is_active: true
        },
        select: { id: true, name: true }
      });
      return res.json(subjects);
    } else {
      // User is not a student (e.g., teacher, admin), fetch all active subjects in org
      const subjects = await prisma.subject.findMany({
        where: {
          organization_id: organizationId,
          is_active: true
        },
        select: { id: true, name: true }
      });
      return res.json(subjects);
    }
  } catch (error: any) {
    console.error('Error fetching user subjects:', error);
    res.status(500).json({ message: 'Server error fetching subjects' });
  }
});

router.get('/profile/:id', async (req: any, res: Response) => {
  try {
    // First, fetch basic user to determine role
    const userBase = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { role: true }
    });
    if (!userBase) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Platform admins do not have student enrollments or academic contexts.
    // Eager loading these relationships for them causes unnecessary strain and intermittent errors.
    const isPlatformAdmin = userBase.role?.name === 'SYSTEM_ADMIN';

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        role: true,
        user_profile: true,
        student_profile: !isPlatformAdmin,
        enrollments: isPlatformAdmin ? false : {
          take: 1,
          orderBy: { enrollment_date: 'desc' }
        }
      }
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
      favorite_subjects: user.user_profile.favorite_subjects,
      favorite_colour: user.user_profile.favorite_colour,
      profile_image: user.user_profile.profile_image,
      academic_profiles: user.user_profile.academic_profiles || [],
      date_of_birth: user.user_profile.date_of_birth,
      academic_birth: user.user_profile.academic_birth
    } : {
      academic_profiles: [],
      favorite_subjects: []
    };

    const roll_number = user.roll_number || user.enrollments?.[0]?.roll_number || null;
    const date_of_birth = user.user_profile?.date_of_birth || user.student_profile?.date_of_birth || null;
    const academic_birth = user.user_profile?.academic_birth || user.student_profile?.academic_birth || null;

    res.json({ ...user, ...profileData, roll_number, date_of_birth, academic_birth });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile/:id', upload.single('profile_image'), async (req: any, res: Response) => {
  try {
    const parsed = ProfileUpdateSchema.parse(req.body);
    let { name, email, phone, city, country, address, about, academic_profiles, roll_number, date_of_birth, academic_birth, favorite_subjects, favorite_colour } = parsed;

    // Handle multipart/form-data where JSON arrays are sent as strings
    if (typeof academic_profiles === 'string') {
      try { academic_profiles = JSON.parse(academic_profiles); } catch (e) { academic_profiles = []; }
    }
    if (typeof favorite_subjects === 'string') {
      try { favorite_subjects = JSON.parse(favorite_subjects); } catch (e) { favorite_subjects = []; }
    }


    let profile_image = undefined;
    if (req.file) {
      const outputDir = path.join(process.cwd(), 'uploads', 'profile');
      const processed = await processImage(req.file.buffer, req.file.originalname, {
        outputDirectory: outputDir,
        width: 800,
        height: 800,
        quality: 80,
        format: 'webp',
        skipIfSmall: true
      });
      profile_image = `/api/uploads/profile/${processed.filename}`;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      await UserValidationService.checkGlobalEmailUnique(email, req.params.id);
    }

    // Update core User fields
    await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email }
    });

    // Upsert UserProfile fields
    const updateData: any = { phone, city, country, address, about, academic_profiles, favorite_subjects, favorite_colour };
    if (profile_image) {
      updateData.profile_image = profile_image;
    }
    if (date_of_birth !== undefined) {
      updateData.date_of_birth = date_of_birth ? new Date(date_of_birth) : null;
    }
    if (academic_birth !== undefined) {
      updateData.academic_birth = academic_birth ? new Date(academic_birth) : null;
    }

    await prisma.userProfile.upsert({
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
        favorite_subjects: favorite_subjects || [],
        favorite_colour,
        profile_image,
        academic_profiles: academic_profiles || [],
        ...(date_of_birth !== undefined && { date_of_birth: date_of_birth ? new Date(date_of_birth) : null }),
        ...(academic_birth !== undefined && { academic_birth: academic_birth ? new Date(academic_birth) : null })
      }
    });

    if (roll_number !== undefined && roll_number !== 'undefined' && roll_number !== 'null') {
      const latestEnrollment = await prisma.studentEnrollment.findFirst({
        where: { student_id: req.params.id },
        orderBy: { enrollment_date: 'desc' }
      });
      if (latestEnrollment) {
        await prisma.studentEnrollment.update({
          where: { id: latestEnrollment.id },
          data: { roll_number: roll_number === '' ? null : roll_number }
        });
      }
    }

    if (date_of_birth !== undefined || academic_birth !== undefined) {
      await prisma.studentProfile.upsert({
        where: { user_id: req.params.id },
        update: {
          ...(date_of_birth !== undefined && { date_of_birth: date_of_birth ? new Date(date_of_birth) : null }),
          ...(academic_birth !== undefined && { academic_birth: academic_birth ? new Date(academic_birth) : null })
        },
        create: {
          user_id: req.params.id,
          organization_id: user.organization_id,
          ...(date_of_birth !== undefined && { date_of_birth: date_of_birth ? new Date(date_of_birth) : null }),
          ...(academic_birth !== undefined && { academic_birth: academic_birth ? new Date(academic_birth) : null })
        }
      });
    }

    res.json({ message: 'Profile updated successfully', user_profile: { profile_image } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.issues
      });
    }
    if (error instanceof AppValidationError) {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
