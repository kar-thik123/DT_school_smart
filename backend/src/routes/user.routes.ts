import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { checkSeatAvailability } from '../utils/license-check';

const router = Router();
router.use(authMiddleware);
router.use(requirePermission('IDENTITY', 'IS_MANAGEMENT'));

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role_id: z.string().uuid(),
  grade_id: z.string().uuid().optional().or(z.literal('')),
  section_id: z.string().uuid().optional().or(z.literal('')),
  admission_number: z.string().optional(),
  mobile_number: z.string().optional(),
});

// GET all teachers in org
router.get('/teachers', async (req: any, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { 
        organization_id: req.user.organization_id,
        role: {
          permissions: {
            some: { permission: { module: 'IDENTITY', action: 'IS_TEACHER' } }
          }
        },
        is_active: true
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
        id: true, name: true, email: true, section_id: true, grade_id: true, 
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

// POST create single user
router.post('/', async (req: any, res: Response) => {
  try {
    const parsed = userSchema.parse(req.body);
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

    // Global email uniqueness check — email must be unique across ALL organisations
    const existing = await prisma.user.findFirst({ where: { email: parsed.email } });
    if (existing) return res.status(400).json({ message: `Email '${parsed.email}' is already registered in the platform. Each email can only belong to one account.` });

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
        section_id: parsed.section_id || null
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

    // Explicit return to prevent ERR_HTTP_HEADERS_SENT
    return res.status(201).json({ message: 'User created', user: { id: user.id, name: user.name, email: user.email, role_id: parsed.role_id } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
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
router.post('/bulk', async (req: any, res: Response) => {
  try {
    const users: Array<{ name: string; email: string; password?: string; role_id?: string; role?: string; grade_id?: string; section_id?: string; admission_number?: string; mobile_number?: string }> = req.body.users;
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'No users provided' });
    }

    const org = await prisma.organization.findUnique({ where: { id: req.user.organization_id } });
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // Check license seat availability for bulk
    const licenseCheck = await checkSeatAvailability(req.user.organization_id, users.length);
    if (!licenseCheck.allowed) {
      return res.status(403).json({ 
        message: licenseCheck.message,
        code: 'LICENSE_LIMIT_REACHED',
        usage: licenseCheck.usagePercent
      });
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };
    for (const u of users) {
      try {
        // Global email uniqueness check
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (existing) { results.skipped++; results.errors.push(`${u.email}: already registered in platform`); continue; }
        let roleId = u.role_id;
        
        if (!roleId && u.role) {
            // Dynamic fallback by name if string is provided
            const roleDb = await prisma.role.findFirst({ 
              where: { 
                name: { equals: u.role, mode: 'insensitive' }, 
                OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
              } 
            });
            if (roleDb) roleId = roleDb.id;
        }

        if (!roleId) {
            // Ultimate fallback to ANY IS_STUDENT role
            const studentRole = await prisma.role.findFirst({
               where: {
                   permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } } },
                   OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
               }
            });
            if (studentRole) roleId = studentRole.id;
        }

        if (!roleId) { results.skipped++; results.errors.push(`${u.email}: valid role could not be resolved`); continue; }

        const password_hash = await bcrypt.hash(u.password || 'changeme123', 10);
        const newUser = await prisma.user.create({
          data: { name: u.name, email: u.email, password_hash, role_id: roleId, organization_id: req.user.organization_id, grade_id: u.grade_id || null, section_id: u.section_id || null }
        });

        // Check if student
        const isStudent = await prisma.rolePermission.findFirst({
          where: { role_id: roleId, permission: { module: 'IDENTITY', action: 'IS_STUDENT' } }
        });

        if (isStudent && (u.admission_number || u.mobile_number)) {
          await prisma.studentProfile.create({
            data: {
              user_id: newUser.id,
              organization_id: req.user.organization_id,
              admission_number: u.admission_number || null,
              mobile_number: u.mobile_number || null
            }
          });
        }
        results.created++;
      } catch (e) {
        results.errors.push(`${u.email}: failed`);
        results.skipped++;
      }
    }
    res.status(201).json({ message: 'Bulk import complete', ...results });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update user by id
router.put('/:id', async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let updateData: any = { name: req.body.name, is_active: req.body.is_active };
    if (req.body.role_id) {
      const roleDb = await prisma.role.findFirst({ 
        where: { 
            id: req.body.role_id, 
            OR: [{ organization_id: req.user.organization_id }, { is_system: true }]
        } 
      });
      if (roleDb) updateData.role_id = roleDb.id;
    } else if (req.body.role) {
      // Legacy support for string updates if any still exist
      const roleDb = await prisma.role.findFirst({ 
        where: { name: req.body.role, OR: [{ organization_id: req.user.organization_id }, { is_system: true }] } 
      });
      if (roleDb) updateData.role_id = roleDb.id;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { role: true }
    });
    res.json({ message: 'User updated', user: { ...updated, role: updated.role.name } });
  } catch (error: any) {
    if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
       return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH deactivate
router.patch('/:id/deactivate', async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await prisma.user.update({ where: { id: req.params.id }, data: { is_active: false } });
    res.json({ message: 'User deactivated' });
  } catch (error: any) {
    if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
       return res.status(404).json({ message: 'User not found' });
    }
    console.error('User deactivate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
