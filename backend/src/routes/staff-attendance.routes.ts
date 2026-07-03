import { Router, Response } from 'express';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { StaffAttendanceService } from '../services/staff-attendance.service';
import { AcademicContextResolver } from '../utils/academic-context.resolver';
import prisma from '../prisma';

const router = Router();
router.use(authMiddleware);

// =======================
// STAFF ATTENDANCE RECORDS
// =======================

// GET staff list
router.get('/staff-list', requirePermission('STAFF_ATTENDANCE', 'VIEW'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const staffRoles = await prisma.role.findMany({
      where: {
        OR: [
          { name: { in: ['TEACHER', 'MANAGEMENT', 'SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'ACCOUNTANT', 'RECEPTIONIST'] } },
          { name: { notIn: ['STUDENT', 'PARENT'] } }
        ],
        AND: [
          { OR: [{ organization_id: orgId }, { is_system: true }] }
        ]
      }
    });

    const roleIds = staffRoles.map((r: any) => r.id);
    
    const staff = await prisma.user.findMany({
      where: {
        organization_id: orgId,
        role_id: { in: roleIds },
        is_active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        roll_number: true,
        role: { select: { name: true } },
        user_profile: { select: { phone: true, profile_image: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Map to structure expected by frontend (which mimics student enrollment structure)
    const result = staff.map((s: any) => ({
      staff_id: s.id,
      staff: s
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST mark attendance
router.post('/mark', requirePermission('STAFF_ATTENDANCE', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);
    const { phase_id, attendance_date, records } = req.body;
    
    if (!phase_id || !attendance_date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await StaffAttendanceService.markAttendance({
      organization_id: orgId,
      academic_year_id,
      phase_id,
      attendance_date,
      marked_by: req.user.user_id,
      records
    });

    res.json({ message: 'Staff attendance marked successfully', data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET daily attendance
router.get('/daily', requirePermission('STAFF_ATTENDANCE', 'VIEW'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const { phase_id, date } = req.query;

    if (!phase_id || !date) {
      return res.status(400).json({ message: 'phase_id and date are required' });
    }

    const records = await StaffAttendanceService.getDailyAttendance(
      orgId,
      String(phase_id),
      String(date)
    );

    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// GET range attendance
router.get('/range', requirePermission('STAFF_ATTENDANCE', 'VIEW'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date and end_date are required' });
    }

    const records = await StaffAttendanceService.getRangeAttendance(
      orgId,
      String(start_date),
      String(end_date)
    );

    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

