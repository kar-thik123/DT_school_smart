import { Router, Response } from 'express';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { AttendancePhaseService, StudentAttendanceService } from '../services/attendance.service';
import { AcademicContextResolver } from '../utils/academic-context.resolver';

const router = Router();
router.use(authMiddleware);

// =======================
// PHASES
// =======================

// GET phases
router.get('/phases', requirePermission('ATTENDANCE', 'VIEW'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const phases = await AttendancePhaseService.getPhases(orgId);
    res.json(phases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST phase
router.post('/phases', requirePermission('ATTENDANCE', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const { phase_name, start_period, end_period, display_order } = req.body;
    
    if (!phase_name || start_period == null || end_period == null) {
      return res.status(400).json({ message: 'phase_name, start_period, and end_period are required' });
    }

    const phase = await AttendancePhaseService.createPhase(orgId, { phase_name, start_period, end_period, display_order });
    res.status(201).json(phase);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// ATTENDANCE RECORDS
// =======================

// POST mark attendance
router.post('/mark', requirePermission('ATTENDANCE', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);
    const { grade_id, section_id, phase_id, attendance_date, records } = req.body;
    
    if (!grade_id || !phase_id || !attendance_date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const reqDate = new Date(attendance_date);
    const today = new Date();
    reqDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (reqDate > today) {
      return res.status(400).json({ message: 'Attendance cannot be marked for a future date.' });
    }

    if (reqDate < today) {
      return res.status(400).json({ message: "You can't edit past attendance." });
    }

    const result = await StudentAttendanceService.markAttendance({
      organization_id: orgId,
      academic_year_id,
      grade_id,
      section_id,
      phase_id,
      attendance_date,
      marked_by: req.user.user_id,
      records
    });

    res.json({ message: 'Attendance marked successfully', data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET daily attendance
router.get('/daily', requirePermission('ATTENDANCE', 'VIEW'), async (req: any, res: Response) => {
  console.time('Route /daily: Total Request Time');
  try {
    const orgId = req.user.organization_id;
    const { grade_id, section_id, phase_id, date } = req.query;

    if (!grade_id || !phase_id || !date) {
      console.timeEnd('Route /daily: Total Request Time');
      return res.status(400).json({ message: 'grade_id, phase_id, and date are required' });
    }

    console.time('Route /daily: Controller to Service');
    const records = await StudentAttendanceService.getDailyAttendance(
      orgId,
      String(grade_id),
      section_id ? String(section_id) : undefined,
      String(phase_id),
      String(date)
    );
    console.timeEnd('Route /daily: Controller to Service');

    console.time('Route /daily: Response Mapping');
    res.json(records);
    console.timeEnd('Route /daily: Response Mapping');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
  console.timeEnd('Route /daily: Total Request Time');
});

// GET range attendance
router.get('/range', requirePermission('ATTENDANCE', 'VIEW'), async (req: any, res: Response) => {
  console.time('Route /range: Total Request Time');
  try {
    const orgId = req.user.organization_id;
    const { grade_id, section_id, start_date, end_date } = req.query;

    if (!grade_id || !start_date || !end_date) {
      console.timeEnd('Route /range: Total Request Time');
      return res.status(400).json({ message: 'grade_id, start_date, and end_date are required' });
    }

    console.time('Route /range: Controller to Service');
    const records = await StudentAttendanceService.getRangeAttendance(
      orgId,
      String(grade_id),
      section_id ? String(section_id) : undefined,
      String(start_date),
      String(end_date)
    );
    console.timeEnd('Route /range: Controller to Service');

    console.time('Route /range: Response Mapping');
    res.json(records);
    console.timeEnd('Route /range: Response Mapping');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
  console.timeEnd('Route /range: Total Request Time');
});

// GET summary percentage
router.get('/summary', requirePermission('ATTENDANCE', 'VIEW'), async (req: any, res: Response) => {
  try {
    const orgId = req.user.organization_id;
    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);
    const { grade_id, section_id } = req.query;

    if (!grade_id) {
      return res.status(400).json({ message: 'grade_id is required' });
    }

    const summary = await StudentAttendanceService.getSummaryPercentage(
      orgId,
      academic_year_id,
      String(grade_id),
      section_id ? String(section_id) : undefined
    );

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
