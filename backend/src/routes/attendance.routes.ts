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
  try {
    const orgId = req.user.organization_id;
    const { grade_id, section_id, phase_id, date } = req.query;

    if (!grade_id || !phase_id || !date) {
      return res.status(400).json({ message: 'grade_id, phase_id, and date are required' });
    }

    const records = await StudentAttendanceService.getDailyAttendance(
      orgId,
      String(grade_id),
      section_id ? String(section_id) : undefined,
      String(phase_id),
      String(date)
    );

    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
