import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { AuthorizationService } from '../services/authorization.service';
import { AcademicContextResolver } from '../utils/academic-context.resolver';
import { ExaminationCalculationService } from '../services/ExaminationCalculationService';

async function validateTeacherScope(req: any, grade_id: string, section_id?: string | null) {
  const permissions = req.user?.permissions || [];
  if (permissions.includes('IDENTITY:IS_SUPER_ADMIN') || permissions.includes('IDENTITY:IS_MANAGEMENT')) {
    return true;
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacher_id: req.user.user_id,
      grade_id: grade_id,
      ...(section_id ? { section_id } : {}),
      organization_id: req.user.organization_id,
      academic_year_id: await AcademicContextResolver.resolveAcademicYearId(req)
    }
  });

  if (!assignment) {
    throw new Error('Forbidden: You are not assigned to this class');
  }
}

const router = Router();

router.get('/debug-get', async (req: any, res) => {
  try {
    const filter = {
      organization_id: "81b84e56-276e-4f6a-8e4e-bf1d90afd5b6",
      academic_year_id: "a7adc173-2314-41c8-b2be-329236e2410b",
      examination_id: req.query.examination_id || "9c8fb0d5-c79f-4367-8e73-cd321e7de669",
      grade_id: req.query.grade_id || "17677aee-c00a-4e59-b6be-eac0258a863f"
    };

    console.log('[DEBUG-GET] filter:', filter);

    const results = await prisma.studentExamResult.findMany({
      where: filter,
      include: {
        examination: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            roll_number: true,
            student_profile: true
          }
        },
        grade_rel: true,
        section: true,
        subject_results: {
          include: {
            subject: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        modifier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(results);
  } catch (error: any) {
    console.error('[DEBUG-GET] error', error);
    res.status(500).json({ error: error.message });
  }
});

router.use(authMiddleware);

const studentExamSubjectResultSchema = z.object({
  subject_id: z.string().uuid(),
  max_marks: z.number().min(0),
  obtained_marks: z.number().min(0),
  pass_marks: z.number().min(0).optional().nullable(),
  is_absent: z.boolean().optional(),
  status: z.enum(['PASS', 'FAIL', 'WITHHELD']).optional().nullable(),
  grade: z.string().optional().nullable(),
  remarks: z.string().optional().nullable()
});

const studentExamResultSchema = z.object({
  examination_id: z.string().uuid(),
  student_id: z.string().uuid(),
  grade_id: z.string().uuid(),
  section_id: z.string().uuid().optional().nullable(),
  total_max_marks: z.number().optional().nullable(),
  total_obtained_marks: z.number().optional().nullable(),
  percentage: z.number().optional().nullable(),
  result_status: z.enum(['PASS', 'FAIL', 'WITHHELD']).optional().nullable(),
  grade: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  subject_results: z.array(studentExamSubjectResultSchema).optional()
});

/**
 * GET /api/student-exam-results
 * List all student exam results for the current organization
 */
router.get('/', async (req: any, res: Response) => {
  try {
    const userPermissions = req.user?.permissions || [];
    if (!AuthorizationService.hasPermission(userPermissions, 'STUDENT_EXAM_RESULT', 'VIEW') &&
        !AuthorizationService.hasPermission(userPermissions, 'STUDENT_EXAM_RESULT', 'MANAGE')) {
      return res.status(403).json({ message: 'Forbidden: Requires STUDENT_EXAM_RESULT:VIEW or STUDENT_EXAM_RESULT:MANAGE' });
    }

    const isRestrictedToSelf = userPermissions.includes('IDENTITY:IS_STUDENT') && 
                               !AuthorizationService.hasPermission(userPermissions, 'STUDENT_EXAM_RESULT', 'MANAGE');

    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);
    const { examination_id, grade_id, section_id } = req.query;

    const filter: any = {
      organization_id: req.user.organization_id,
      academic_year_id
    };

    if (isRestrictedToSelf) {
      filter.student_id = req.user.user_id;
    } else if (req.query.student_id) {
      filter.student_id = String(req.query.student_id);
    }

    if (examination_id) filter.examination_id = String(examination_id);
    if (grade_id) filter.grade_id = String(grade_id);
    // We purposefully omit section_id from the filter here because an exam result 
    // might have been created with section_id = null (when "All Sections" was selected).
    // The uniqueness is per student + examination, so fetching all for the grade is correct.

    console.log('[GET /student-exam-results] filter:', filter);

    const results = await prisma.studentExamResult.findMany({
      where: filter,
      include: {
        examination: true,
        student: { select: { id: true, name: true, email: true } },
        grade_rel: true,
        section: true,
        subject_results: {
          include: { subject: true }
        },
        creator: { select: { id: true, name: true, email: true } },
        modifier: { select: { id: true, name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`[GET /student-exam-results] found ${results.length} results`);
    res.json(results);
  } catch (error) {
    console.error('[StudentExamResultRoutes] GET / error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/student-exam-results/:id
 * Get a specific student exam result
 */
router.get('/:id', async (req: any, res: Response) => {
  try {
    const userPermissions = req.user?.permissions || [];
    if (!AuthorizationService.hasPermission(userPermissions, 'STUDENT_EXAM_RESULT', 'VIEW') &&
        !AuthorizationService.hasPermission(userPermissions, 'STUDENT_EXAM_RESULT', 'MANAGE')) {
      return res.status(403).json({ message: 'Forbidden: Requires STUDENT_EXAM_RESULT:VIEW or STUDENT_EXAM_RESULT:MANAGE' });
    }

    const result = await prisma.studentExamResult.findUnique({
      where: { id: req.params.id },
      include: {
        examination: true,
        student: { select: { id: true, name: true, email: true } },
        grade_rel: true,
        section: true,
        subject_results: {
          include: { subject: true }
        },
        creator: { select: { id: true, name: true, email: true } },
        modifier: { select: { id: true, name: true, email: true } }
      }
    });

    if (!result) return res.status(404).json({ message: 'Student Exam Result not found' });
    if (result.organization_id !== req.user.organization_id) return res.status(403).json({ message: 'Forbidden' });

    const isStudent = userPermissions.includes('IDENTITY:IS_STUDENT');
    if (isStudent && result.student_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden: Cannot access another student\'s results' });
    }

    res.json(result);
  } catch (error) {
    console.error('[StudentExamResultRoutes] GET /:id error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/student-exam-results
 * Create a new student exam result
 */
router.post('/', requirePermission('STUDENT_EXAM_RESULT', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const parsed = studentExamResultSchema.parse(req.body);
    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);

    await validateTeacherScope(req, parsed.grade_id, parsed.section_id);
    const calcResult = ExaminationCalculationService.calculateAggregateResult(parsed.subject_results || [] as any);

    const existing = await prisma.studentExamResult.findFirst({
      where: {
        examination_id: parsed.examination_id,
        student_id: parsed.student_id,
        organization_id: req.user.organization_id,
        academic_year_id: academic_year_id
      }
    });
    if (existing) return res.status(400).json({ message: 'A result for this student in this examination already exists' });

    const result = await prisma.studentExamResult.create({
      data: {
        examination_id: parsed.examination_id,
        student_id: parsed.student_id,
        organization_id: req.user.organization_id,
        academic_year_id: academic_year_id,
        grade_id: parsed.grade_id,
        section_id: parsed.section_id || null,
        total_max_marks: calcResult.total_max_marks,
        total_obtained_marks: calcResult.total_obtained_marks,
        percentage: calcResult.percentage,
        result_status: null,
        grade: null,
        remarks: parsed.remarks,
        created_by: req.user.user_id,
        subject_results: {
          create: parsed.subject_results?.map(s => ({
            subject_id: s.subject_id,
            max_marks: s.max_marks,
            obtained_marks: s.obtained_marks,
            pass_marks: s.pass_marks,
            is_absent: s.is_absent || false,
            status: s.status as any,
            grade: s.grade,
            remarks: s.remarks
          })) || []
        }
      },
      include: {
        subject_results: true
      }
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('[StudentExamResultRoutes] POST / error', error);
    res.status(400).json({ message: error.message || 'Bad request' });
  }
});

/**
 * POST /api/student-exam-results/bulk
 * Upsert multiple student exam results
 */
router.post('/bulk', requirePermission('STUDENT_EXAM_RESULT', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const payloads = req.body;
    if (!Array.isArray(payloads)) return res.status(400).json({ message: 'Expected an array of payloads' });

    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);

    const updatedResults = await prisma.$transaction(async (tx: any) => {
      const results = [];
      for (const payload of payloads) {
        const parsed = studentExamResultSchema.parse(payload);
        let existing_id = payload.existing_result_id;

        await validateTeacherScope(req, parsed.grade_id, parsed.section_id);
        const calcResult = ExaminationCalculationService.calculateAggregateResult(parsed.subject_results || [] as any);

        if (!existing_id) {
          const existing = await tx.studentExamResult.findFirst({
            where: {
              examination_id: parsed.examination_id,
              student_id: parsed.student_id,
              organization_id: req.user.organization_id,
              academic_year_id: academic_year_id
            }
          });
          if (existing) {
            existing_id = existing.id;
          }
        }

        if (existing_id) {
          // Verify existing record
          const existingResult = await tx.studentExamResult.findUnique({ where: { id: existing_id } });
          if (!existingResult || existingResult.organization_id !== req.user.organization_id) {
            throw new Error(`Forbidden or not found: result ID ${existing_id}`);
          }

          // Delete existing subject results
          await tx.studentExamSubjectResult.deleteMany({
            where: { student_exam_result_id: existing_id }
          });

          // Update main result and create new subject results
          const updated = await tx.studentExamResult.update({
            where: { id: existing_id },
            data: {
              examination_id: parsed.examination_id,
              student_id: parsed.student_id,
              academic_year_id: academic_year_id,
              grade_id: parsed.grade_id,
              section_id: parsed.section_id || null,
              total_max_marks: calcResult.total_max_marks,
              total_obtained_marks: calcResult.total_obtained_marks,
              percentage: calcResult.percentage,
              result_status: null,
              grade: null,
              remarks: parsed.remarks,
              modified_by: req.user.user_id,
              subject_results: {
                create: parsed.subject_results?.map(s => ({
                  subject_id: s.subject_id,
                  max_marks: s.max_marks,
                  obtained_marks: s.obtained_marks,
                  pass_marks: s.pass_marks,
                  is_absent: s.is_absent || false,
                  status: s.status as any,
                  grade: s.grade,
                  remarks: s.remarks
                })) || []
              }
            },
            include: { subject_results: true }
          });
          results.push(updated);
        } else {
          const created = await tx.studentExamResult.create({
            data: {
              examination_id: parsed.examination_id,
              student_id: parsed.student_id,
              organization_id: req.user.organization_id,
              academic_year_id: academic_year_id,
              grade_id: parsed.grade_id,
              section_id: parsed.section_id || null,
              total_max_marks: calcResult.total_max_marks,
              total_obtained_marks: calcResult.total_obtained_marks,
              percentage: calcResult.percentage,
              result_status: null,
              grade: null,
              remarks: parsed.remarks,
              created_by: req.user.user_id,
              subject_results: {
                create: parsed.subject_results?.map(s => ({
                  subject_id: s.subject_id,
                  max_marks: s.max_marks,
                  obtained_marks: s.obtained_marks,
                  pass_marks: s.pass_marks,
                  is_absent: s.is_absent || false,
                  status: s.status as any,
                  grade: s.grade,
                  remarks: s.remarks
                })) || []
              }
            },
            include: { subject_results: true }
          });
          results.push(created);
        }
      }
      return results;
    }, {
      maxWait: 5000,
      timeout: 30000
    });

    res.status(200).json({ message: 'Bulk upsert successful', data: updatedResults });
  } catch (error: any) {
    console.error('[StudentExamResultRoutes] POST /bulk error', error);
    res.status(400).json({ message: error.message || 'Bad request' });
  }
});

/**
 * PUT /api/student-exam-results/:id
 * Update an existing student exam result
 */
router.put('/:id', requirePermission('STUDENT_EXAM_RESULT', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const parsed = studentExamResultSchema.parse(req.body);
    const academic_year_id = await AcademicContextResolver.resolveAcademicYearId(req);
    
    await validateTeacherScope(req, parsed.grade_id, parsed.section_id);
    const calcResult = ExaminationCalculationService.calculateAggregateResult(parsed.subject_results || [] as any);

    const result = await prisma.studentExamResult.findUnique({ where: { id: req.params.id } });

    if (!result) return res.status(404).json({ message: 'Student Exam Result not found' });
    if (result.organization_id !== req.user.organization_id) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.$transaction(async (tx: any) => {
      // Delete existing subject results
      await tx.studentExamSubjectResult.deleteMany({
        where: { student_exam_result_id: req.params.id }
      });

      // Update main result and create new subject results
      return tx.studentExamResult.update({
        where: { id: req.params.id },
        data: {
          examination_id: parsed.examination_id,
          student_id: parsed.student_id,
          academic_year_id: academic_year_id,
          grade_id: parsed.grade_id,
          section_id: parsed.section_id || null,
          total_max_marks: calcResult.total_max_marks,
          total_obtained_marks: calcResult.total_obtained_marks,
          percentage: calcResult.percentage,
          result_status: null,
          grade: null,
          remarks: parsed.remarks,
          modified_by: req.user.user_id,
          subject_results: {
            create: parsed.subject_results?.map(s => ({
              subject_id: s.subject_id,
              max_marks: s.max_marks,
              obtained_marks: s.obtained_marks,
              pass_marks: s.pass_marks,
              is_absent: s.is_absent || false,
              status: s.status as any,
              grade: s.grade,
              remarks: s.remarks
            })) || []
          }
        },
        include: {
          subject_results: true
        }
      });
    });

    res.json(updated);
  } catch (error: any) {
    console.error('[StudentExamResultRoutes] PUT /:id error', error);
    res.status(400).json({ message: error.message || 'Bad request' });
  }
});

/**
 * DELETE /api/student-exam-results/:id
 * Delete a student exam result
 */
router.delete('/:id', requirePermission('STUDENT_EXAM_RESULT', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const result = await prisma.studentExamResult.findUnique({ where: { id: req.params.id } });

    if (!result) return res.status(404).json({ message: 'Student Exam Result not found' });
    if (result.organization_id !== req.user.organization_id) return res.status(403).json({ message: 'Forbidden' });

    // Cascades will delete subject_results automatically
    await prisma.studentExamResult.delete({ where: { id: req.params.id } });
    res.json({ message: 'Student Exam Result deleted successfully' });
  } catch (error) {
    console.error('[StudentExamResultRoutes] DELETE /:id error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
