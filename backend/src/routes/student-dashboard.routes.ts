import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getActiveAcademicYearId } from '../utils/academic-helper';

const router = Router();
router.use(authMiddleware);

const requireStudent = async (req: any, res: Response, next: any) => {
  try {
    if (!req.user.permissions?.includes('IDENTITY:IS_STUDENT')) {
      return res.status(403).json({ message: 'Student identity required.' });
    }

    const organization_id = req.user.organization_id;
    // Check Feature Flag
    const org = await prisma.organization.findUnique({
      where: { id: organization_id },
      select: { enable_student_dashboard: true }
    });
    
    if (!org?.enable_student_dashboard) {
      return res.status(403).json({ message: 'Student Dashboard is currently disabled for your organization.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validating dashboard access.' });
  }
};

/**
 * GET /api/student/dashboard/overview
 * Fetches basic demographic and enrollment context.
 */
router.get('/overview', requireStudent, async (req: any, res: Response) => {
  try {
    const student_id = req.user.user_id;
    const organization_id = req.user.organization_id;
    const activeAcademicYearId = await getActiveAcademicYearId(organization_id);

    const user = await prisma.user.findFirst({
      where: { 
        id: student_id,
        organization_id
      },
      select: {
        name: true,
        roll_number: true,
        user_profile: { select: { profile_image: true } },
        enrollments: {
          where: { 
            organization_id,
            academic_year_id: activeAcademicYearId
          },
          select: {
            grade: { select: { name: true } },
            section: { select: { name: true } },
            subject_group: { select: { name: true } },
            academic_year_id: true,
            academic_year: { select: { name: true } }
          },
          take: 1
        }
      }
    });

    if (!user) return res.status(404).json({ message: 'Student not found' });

    const enrollment = user.enrollments?.[0];

    // Fetch the absolute latest enrollment if no active enrollment exists
    let last_enrollment = null;
    if (!enrollment) {
      const latest = await prisma.studentEnrollment.findFirst({
        where: { student_id, organization_id },
        orderBy: { created_at: 'desc' },
        select: {
          grade: { select: { name: true } },
          academic_year: { select: { name: true } }
        }
      });
      if (latest) {
        last_enrollment = {
          grade: latest.grade?.name,
          academic_year: latest.academic_year?.name
        };
      }
    }

    res.json({
      name: user.name,
      roll_number: user.roll_number,
      profile_picture: user.user_profile?.profile_image || null,
      grade: enrollment?.grade?.name || null,
      section: enrollment?.section?.name || null,
      group: enrollment?.subject_group?.name || null,
      academic_year_id: enrollment?.academic_year_id || activeAcademicYearId,
      academic_year: enrollment?.academic_year?.name || null,
      last_enrollment
    });
  } catch (error) {
    console.error('[Dashboard/Overview] Error:', error);
    res.status(500).json({ message: 'Server error fetching overview' });
  }
});

/**
 * GET /api/student/dashboard/kpis
 * Fetches pre-computed KPIs from the summary table.
 */
router.get('/kpis', requireStudent, async (req: any, res: Response) => {
  try {
    const student_id = req.user.user_id;
    const organization_id = req.user.organization_id;
    const activeAcademicYearId = await getActiveAcademicYearId(organization_id);

    let summary = await prisma.studentDashboardSummary.findUnique({
      where: {
        organization_id_student_id_academic_year_id: {
          organization_id,
          student_id,
          academic_year_id: activeAcademicYearId
        }
      }
    });

    if (!summary) {
      // Return defaults if no activity yet
      return res.json({
        practice_accuracy: 0,
        questions_attempted: 0,
        skills_completion_percentage: 0
      });
    }

    res.json({
      practice_accuracy: summary.practice_accuracy,
      questions_attempted: summary.questions_attempted,
      skills_completion_percentage: summary.skills_completion_percentage
    });
  } catch (error) {
    console.error('[Dashboard/KPIs] Error:', error);
    res.status(500).json({ message: 'Server error fetching KPIs' });
  }
});

/**
 * GET /api/student/dashboard/subject-performance
 * Fetches subject performance aggregated at the database layer.
 */
router.get('/subject-performance', requireStudent, async (req: any, res: Response) => {
  try {
    const student_id = req.user.user_id;
    const organization_id = req.user.organization_id;
    const activeAcademicYearId = await getActiveAcademicYearId(organization_id);

    interface SubjectPerformanceRow {
      subject_name: string;
      total_correct: bigint;
      total_attempted: bigint;
      completed_topics: bigint;
      total_subject_topics: bigint;
    }

    const rawResults = await prisma.$queryRaw<SubjectPerformanceRow[]>`
      SELECT
        s.name as subject_name,
        SUM(pa.correct_answers) as total_correct,
        SUM(pa.total_questions) as total_attempted,
        COUNT(DISTINCT stc.topic_id) as completed_topics,
        (SELECT COUNT(t.id) FROM topics t JOIN units u ON t.unit_id = u.id WHERE u.subject_id = s.id AND t.organization_id = s.organization_id) as total_subject_topics
      FROM practice_attempts pa
      JOIN subjects s ON pa.subject_id = s.id
      LEFT JOIN student_topic_completions stc 
        ON stc.student_id = pa.student_id 
        AND stc.topic_id = pa.topic_id
        AND stc.organization_id = pa.organization_id
        AND stc.academic_year_id = pa.academic_year_id
      WHERE pa.student_id = ${student_id}::uuid 
        AND pa.organization_id = ${organization_id}::uuid
        AND pa.academic_year_id = ${activeAcademicYearId}::uuid
      GROUP BY s.id, s.name, s.organization_id
    `;

    const response = rawResults.map((r: SubjectPerformanceRow) => {
      const attempted = Number(r.total_attempted || 0);
      const correct = Number(r.total_correct || 0);
      const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;
      const completedTopics = Number(r.completed_topics || 0);
      const totalSubjectTopics = Number(r.total_subject_topics || 0);

      return {
        subject_name: r.subject_name,
        accuracy_percentage: accuracy,
        questions_attempted: attempted,
        completed_topics: completedTopics,
        pending_topics: Math.max(0, totalSubjectTopics - completedTopics)
      };
    });

    res.json(response);
  } catch (error) {
    console.error('[Dashboard/SubjectPerformance] Error:', error);
    res.status(500).json({ message: 'Server error fetching subject performance' });
  }
});

/**
 * GET /api/student/dashboard/weekly-trend
 * Fetches weekly practice trend exclusively from the summary table.
 */
router.get('/weekly-trend', requireStudent, async (req: any, res: Response) => {
  try {
    const student_id = req.user.user_id;
    const organization_id = req.user.organization_id;
    const activeAcademicYearId = await getActiveAcademicYearId(organization_id);

    const trends = await prisma.studentDashboardWeeklyTrend.findMany({
      where: {
        organization_id,
        student_id,
        academic_year_id: activeAcademicYearId
      },
      orderBy: {
        week_start_date: 'asc'
      },
      take: 12
    });

    const response = trends.map((t: any) => ({
      week_start_date: t.week_start_date,
      accuracy_percentage: t.accuracy_percentage,
      questions_attempted: t.questions_attempted
    }));

    res.json(response);
  } catch (error) {
    console.error('[Dashboard/WeeklyTrend] Error:', error);
    res.status(500).json({ message: 'Server error fetching weekly trend' });
  }
});

/**
 * GET /api/student/dashboard/curriculum-progress
 * Fetches real-time curriculum progress using database aggregation.
 */
router.get('/curriculum-progress', requireStudent, async (req: any, res: Response) => {
  try {
    const student_id = req.user.user_id;
    const organization_id = req.user.organization_id;
    const activeAcademicYearId = await getActiveAcademicYearId(organization_id);

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        student_id,
        organization_id,
        academic_year_id: activeAcademicYearId
      }
    });

    if (!enrollment) {
      return res.json([]);
    }

    interface CurriculumProgressRow {
      subject_id: string;
      subject_name: string;
      total_units: bigint;
      completed_units: bigint;
      total_topics: bigint;
      completed_topics: bigint;
    }

    const section_id = enrollment.section_id || null;
    
    // We construct the section condition safely for Prisma $queryRaw
    const sectionCondition = section_id 
      ? Prisma.sql`AND (ct.section_id = ${section_id}::uuid OR ct.section_id IS NULL)`
      : Prisma.sql`AND ct.section_id IS NULL`;

    const rawResults = await prisma.$queryRaw<CurriculumProgressRow[]>`
      SELECT
        s.id as subject_id,
        s.name as subject_name,
        (SELECT COUNT(u.id) FROM units u WHERE u.subject_id = s.id AND u.organization_id = s.organization_id) as total_units,
        (SELECT COUNT(ct.id) FROM completion_tracking ct 
         WHERE ct.subject_id = s.id 
           AND ct.completion_level = 'UNIT' 
           AND ct.is_completed = true 
           AND ct.grade_id = ${enrollment.grade_id}::uuid 
           AND ct.academic_year_id = ${enrollment.academic_year_id}::uuid 
           AND ct.organization_id = ${organization_id}::uuid 
           ${sectionCondition}
        ) as completed_units,
        (SELECT COUNT(t.id) FROM topics t JOIN units u ON t.unit_id = u.id WHERE u.subject_id = s.id AND t.organization_id = s.organization_id) as total_topics,
        (SELECT COUNT(ct.id) FROM completion_tracking ct 
         WHERE ct.subject_id = s.id 
           AND ct.completion_level = 'TOPIC' 
           AND ct.is_completed = true 
           AND ct.grade_id = ${enrollment.grade_id}::uuid 
           AND ct.academic_year_id = ${enrollment.academic_year_id}::uuid 
           AND ct.organization_id = ${organization_id}::uuid 
           ${sectionCondition}
        ) as completed_topics
      FROM subjects s
      WHERE s.grade_id = ${enrollment.grade_id}::uuid 
        AND s.organization_id = ${organization_id}::uuid
      ORDER BY s.sort_order ASC, s.name ASC
    `;

    const response = rawResults.map((r: CurriculumProgressRow) => {
      const totalUnits = Number(r.total_units || 0);
      const completedUnits = Number(r.completed_units || 0);
      const totalTopics = Number(r.total_topics || 0);
      const completedTopics = Number(r.completed_topics || 0);
      
      const completionPercentage = totalTopics > 0 
        ? (completedTopics / totalTopics) * 100 
        : 0;

      return {
        subject_id: r.subject_id,
        subject_name: r.subject_name,
        total_units: totalUnits,
        completed_units: completedUnits,
        pending_units: Math.max(0, totalUnits - completedUnits),
        total_topics: totalTopics,
        completed_topics: completedTopics,
        pending_topics: Math.max(0, totalTopics - completedTopics),
        completion_percentage: Math.min(100, completionPercentage)
      };
    });

    res.json(response);
  } catch (error) {
    console.error('[Dashboard/CurriculumProgress] Error:', error);
    res.status(500).json({ message: 'Server error fetching curriculum progress' });
  }
});

/**
 * GET /api/student/dashboard/teachers
 * Fetches teacher and support contact based on enrollment.
 */
router.get('/teachers', requireStudent, async (req: any, res: Response) => {
  try {
    const student_id = req.user.user_id;
    const organization_id = req.user.organization_id;
    const activeAcademicYearId = await getActiveAcademicYearId(organization_id);

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        student_id,
        organization_id,
        academic_year_id: activeAcademicYearId
      }
    });

    if (!enrollment) {
      return res.json([]);
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        organization_id,
        academic_year_id: enrollment.academic_year_id,
        grade_id: enrollment.grade_id,
        OR: [
          { section_id: enrollment.section_id },
          { section_id: null }
        ]
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subject: {
          select: {
            name: true
          }
        }
      }
    });

    // Group by teacher to consolidate subjects
    const teacherMap = new Map<string, any>();

    for (const a of assignments) {
      if (!a.teacher) continue;
      
      if (!teacherMap.has(a.teacher.id)) {
        teacherMap.set(a.teacher.id, {
          teacher_id: a.teacher.id,
          teacher_name: a.teacher.name,
          official_email: a.teacher.email,
          assigned_subjects: new Set<string>()
        });
      }

      const tObj = teacherMap.get(a.teacher.id);
      if (a.subject?.name) {
        tObj.assigned_subjects.add(a.subject.name);
      }
    }

    const response = Array.from(teacherMap.values()).map(t => ({
      ...t,
      assigned_subjects: Array.from(t.assigned_subjects)
    }));

    res.json(response);
  } catch (error) {
    console.error('[Dashboard/Teachers] Error:', error);
    res.status(500).json({ message: 'Server error fetching teachers' });
  }
});

/**
 * GET /api/student/dashboard/activities
 * Fetches a unified chronological timeline of student activities.
 */
router.get('/activities', requireStudent, async (req: any, res: Response) => {
  try {
    const student_id = req.user.user_id;
    const organization_id = req.user.organization_id;
    const activeAcademicYearId = await getActiveAcademicYearId(organization_id);

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        student_id,
        organization_id,
        academic_year_id: activeAcademicYearId
      }
    });

    if (!enrollment) {
      return res.json([]);
    }

    // 1. Practice Attempts (scoped to active academic year)
    const practices = await prisma.practiceAttempt.findMany({
      where: { student_id, organization_id, academic_year_id: activeAcademicYearId },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: { subject: { select: { name: true } } }
    });

    // 2. Completion Events (already scoped to academic year from enrollment)
    const completions = await prisma.completionTracking.findMany({
      where: {
        organization_id,
        academic_year_id: activeAcademicYearId,
        grade_id: enrollment.grade_id,
        is_completed: true,
        OR: [
          { section_id: enrollment.section_id },
          { section_id: null }
        ]
      },
      orderBy: { completed_at: 'desc' },
      take: 10
    });

    // 3. Skill Verifications (scoped to active academic year)
    const skills = await prisma.skill.findMany({
      where: {
        user_id: student_id,
        academic_year_id: activeAcademicYearId,
        status: { in: ['verified', 'VERIFIED', 'approved', 'APPROVED'] }
      },
      orderBy: { updated_at: 'desc' },
      take: 10
    });

    // 4. Notifications (not strictly bound to AY in schema, but we only take recent)
    const notificationRecipients = await prisma.notificationRecipient.findMany({
      where: {
        user_id: student_id,
        notification: {
          organization_id
        }
      },
      include: {
        notification: true
      },
      orderBy: {
        notification: { created_at: 'desc' }
      },
      take: 10
    });

    // Merge and sort
    const activities: any[] = [];

    practices.forEach((p: any) => {
      activities.push({
        id: p.id,
        type: 'practice',
        date: p.created_at,
        title: `Practice Quiz: ${p.subject?.name || 'Subject'}`,
        description: `Attempted ${p.total_questions} questions with ${p.correct_answers} correct answers.`,
        reference_id: p.id
      });
    });

    completions.forEach((c: any) => {
      if (!c.completed_at) return;
      activities.push({
        id: c.id,
        type: 'completion',
        date: c.completed_at,
        title: `Curriculum Completed`,
        description: `Marked as complete at ${c.completion_level.toLowerCase()} level.`,
        reference_id: c.id
      });
    });

    skills.forEach((s: any) => {
      activities.push({
        id: s.id,
        type: 'skill',
        date: s.updated_at,
        title: `Skill Verified: ${s.skill_name}`,
        description: `Your skill in ${s.skill_type} has been officially verified.`,
        reference_id: s.id
      });
    });

    notificationRecipients.forEach((nr: any) => {
      if (!nr.notification) return;
      activities.push({
        id: nr.id,
        type: 'notification',
        date: nr.notification.created_at,
        title: nr.notification.title,
        description: nr.notification.message,
        reference_id: nr.notification.id
      });
    });

    // Sort descending by date
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    res.json(activities.slice(0, 30));
  } catch (error) {
    console.error('[Dashboard/Activities] Error:', error);
    res.status(500).json({ message: 'Server error fetching activities' });
  }
});

export default router;
