import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

// --- MANAGEMENT TOPIC ANALYTICS ---
// View performance and Validation Engine labels
router.get('/topic', requirePermission('IDENTITY', 'IS_MANAGEMENT'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const { grade_id, section_id, subject_id } = req.query;

    // TopicActivation → subjectGroup → section (no direct section relation on the model)
    const filter: any = { organization_id: org_id };
    if (section_id) filter.subjectGroup = { section_id: String(section_id) };
    else if (grade_id) filter.subjectGroup = { section: { grade_id: String(grade_id) } };

    const topicActivations = await prisma.topicActivation.findMany({
      where: filter,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            unit: { select: { subject_id: true } }
          }
        },
        subjectGroup: {
          select: {
            section_id: true,
            section: { select: { id: true, name: true, grade_id: true } }
          }
        }
      }
    });

    const results = [];

    for (const activation of topicActivations) {
      if (subject_id && activation.topic.unit.subject_id !== subject_id) continue;

      const sectionId = activation.subjectGroup?.section_id;

      const attempts = await prisma.practiceAttempt.findMany({
        where: {
          topic_id: activation.topic_id,
          organization_id: org_id,
          student: { section_id: sectionId }
        }
      });

      const totalStudents = await prisma.user.count({
        where: { section_id: sectionId, organization_id: org_id, is_active: true }
      });

      const uniqueStudentsAttempted = new Set(attempts.map((a: any) => a.student_id)).size;

      let avgAccuracy = 0;
      let passCount = 0;

      if (attempts.length > 0) {
        let totalPct = 0;
        attempts.forEach((a: any) => {
          const pct = (a.correct_answers / Math.max(a.total_questions, 1)) * 100;
          totalPct += pct;
          if (pct >= 40) passCount++;
        });
        avgAccuracy = totalPct / attempts.length;
      }

      // Teaching Validation Logic
      let teachingValidation = 'N/A';
      if (attempts.length > 0) {
        if (avgAccuracy >= 70) teachingValidation = 'GOOD';
        else if (avgAccuracy >= 40) teachingValidation = 'AVERAGE';
        else teachingValidation = 'POOR';
      }

      // Fake Completion Detection
      if (activation.is_completed && avgAccuracy < 40 && attempts.length > 0) {
        teachingValidation = 'INVALID COMPLETION';
      }

      results.push({
        topic_activation_id: activation.id,
        topic_id: activation.topic.id,
        topic_name: activation.topic.name,
        section_name: activation.subjectGroup?.section?.name ?? 'N/A',
        is_completed: activation.is_completed,
        total_students: totalStudents,
        students_attempted: uniqueStudentsAttempted,
        average_accuracy: Math.round(avgAccuracy),
        pass_percentage: uniqueStudentsAttempted ? Math.round((passCount / attempts.length) * 100) : 0,
        teaching_validation: teachingValidation
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Topic analytics error:', error);
    res.status(500).json({ message: 'Error fetching topic analytics' });
  }
});


// --- TEACHER CLASS/SUBJECT ANALYTICS ---
// NO validation labels allowed
router.get('/teacher', requirePermission('IDENTITY', 'IS_TEACHER'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const teacher_id = req.user.user_id;

    // Get assigned subjects and classes
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacher_id, organization_id: org_id },
      include: {
        subject: true,
        section: {
          select: {
            id: true,
            name: true
          }
        },
        grade: true
      }
    });

    // Simplify analytics: Just collect attempts belonging to those boundaries
    const sectionIds = assignments.map((a: any) => a.section_id).filter(Boolean) as string[];
    const subjectIds = assignments.map((a: any) => a.subject_id).filter(Boolean) as string[];

    const attempts = await prisma.practiceAttempt.findMany({
      where: {
        organization_id: org_id,
        OR: [
          { student: { section_id: { in: sectionIds } } },
          { subject_id: { in: subjectIds } }
        ]
      },
      include: {
        subject: { select: { id: true, name: true } },
        student: { select: { id: true, name: true, section_id: true } }
      }
    });

    // Aggregate class/subject performance
    const subjectPerformance: Record<string, { totalPct: number, count: number, name: string }> = {};

    attempts.forEach((a: any) => {
      const pct = (a.correct_answers / Math.max(a.total_questions, 1)) * 100;
      if (!subjectPerformance[a.subject_id]) {
        subjectPerformance[a.subject_id] = { totalPct: 0, count: 0, name: a.subject.name };
      }
      subjectPerformance[a.subject_id].totalPct += pct;
      subjectPerformance[a.subject_id].count++;
    });

    const parsedSubjects = Object.values(subjectPerformance).map((s: any) => ({
      subject_name: s.name,
      average_accuracy: Math.round(s.totalPct / s.count)
    }));

    // Explicitly omitting the teaching_validation label here per requirements.
    res.json({ subject_performance: parsedSubjects });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher analytics' });
  }
});


// --- MANAGEMENT CONSOLIDATED OVERVIEW ---
// Used for the management dashboard to see teachers, risk students, and general health
router.get('/management/overview', requirePermission('IDENTITY', 'IS_MANAGEMENT'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;

    // 1. Overview Stats (Topics and Performance)
    const topicActivations = await prisma.topicActivation.findMany({
      where: { organization_id: org_id },
      include: {
        topic: { select: { name: true } }
      }
    });

    // 1. Overview Stats
    const roles = await prisma.role.findMany({
      where: {
        organization_id: org_id,
        name: { in: ['STUDENT', 'Student', 'TEACHER', 'Teacher'] }
      }
    });

    const studentRole = roles.find((r: any) => r.name.toUpperCase() === 'STUDENT');
    const teacherRole = roles.find((r: any) => r.name.toUpperCase() === 'TEACHER');

    if (!studentRole || !teacherRole) {
      return res.json({
        avg_preparedness: 0,
        total_students: 0,
        active_modules: 0,
        critical_alerts: 0,
        teacher_performance: [],
        risk_students: []
      });
    }

    const attempts = await prisma.practiceAttempt.findMany({
      where: { organization_id: org_id }
    });

    let totalPoints = 0;
    attempts.forEach((a: any) => totalPoints += (a.correct_answers / Math.max(a.total_questions, 1)) * 100);
    const avgPreparedness = attempts.length > 0 ? Math.round(totalPoints / attempts.length) : 0;

    const totalStudents = await prisma.user.count({
      where: { organization_id: org_id, role_id: studentRole?.id, is_active: true }
    });

    // 2. Teacher Performance
    const teachers = await prisma.user.findMany({
      where: { organization_id: org_id, role_id: teacherRole?.id, is_active: true },
      include: {
        teacher_assignments: {
          include: {
            subject: { select: { name: true } }
          }
        }
      }
    });

    const teacherPerformance = [];
    for (const t of teachers) {
      const subjectIds = (t.teacher_assignments || []).map((a: any) => a.subject_id).filter(Boolean) as string[];
      const tAttempts = subjectIds.length > 0
        ? await prisma.practiceAttempt.findMany({ where: { organization_id: org_id, subject_id: { in: subjectIds } } })
        : [];

      let tPct = 0;
      tAttempts.forEach((a: any) => tPct += (a.correct_answers / Math.max(a.total_questions, 1)) * 100);
      const tAvg = tAttempts.length > 0 ? Math.round(tPct / tAttempts.length) : 0;

      teacherPerformance.push({
        name: t.name,
        subject: (t.teacher_assignments && t.teacher_assignments[0]?.subject?.name) || 'Multi-Subject',
        performance: tAvg,
        status: tAvg >= 70 ? 'GOOD' : (tAvg >= 40 ? 'AVERAGE' : 'POOR')
      });
    }

    // 3. High Risk Students
    const allStudents = await prisma.user.findMany({
      where: { organization_id: org_id, role_id: studentRole?.id, is_active: true },
      include: { section: { select: { name: true } } }
    });

    const riskStudents = [];
    for (const s of allStudents) {
      const sAttempts = await prisma.practiceAttempt.findMany({
        where: { student_id: s.id }
      });
      if (sAttempts.length === 0) continue;

      let sPct = 0;
      sAttempts.forEach((a: any) => sPct += (a.correct_answers / Math.max(a.total_questions, 1)) * 100);
      const sAvg = Math.round(sPct / sAttempts.length);

      if (sAvg < 40) {
        riskStudents.push({
          name: s.name,
          section: s.section?.name || 'N/A',
          score: sAvg
        });
      }
    }

    res.json({
      avg_preparedness: avgPreparedness,
      total_students: totalStudents,
      active_modules: attempts.length,
      critical_alerts: 0,
      teacher_performance: teacherPerformance.sort((a: any, b: any) => b.performance - a.performance),
      risk_students: riskStudents.sort((a: any, b: any) => a.score - b.score).slice(0, 10)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching management overview' });
  }
});


// --- STUDENT SELF ANALYTICS ---
router.get('/student', requirePermission('IDENTITY', 'IS_STUDENT'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const student_id = req.user.user_id;

    const user = await prisma.user.findUnique({
      where: { id: student_id },
      select: { grade_id: true }
    });

    // Fetch subjects scoped to the student's assigned streams (not all grade subjects)
    const groupMappings = await (prisma as any).studentGroupMapping.findMany({
      where: { student_id, organization_id: org_id },
      include: {
        group: {
          include: {
            subjects: { include: { subject: true } }
          }
        }
      }
    });

    // Collect unique subjects from all assigned streams
    const subjectMap = new Map<string, any>();
    for (const m of groupMappings) {
      for (const gs of (m.group?.subjects || [])) {
        if (gs.subject && !subjectMap.has(gs.subject.id)) {
          subjectMap.set(gs.subject.id, gs.subject);
        }
      }
    }
    const enrolledSubjects = Array.from(subjectMap.values());

    const attempts = await prisma.practiceAttempt.findMany({
      where: { student_id, organization_id: org_id },
      include: {
        subject: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } }
      }
    });

    const subjectData: Record<string, { totalPct: number, count: number, name: string }> = {};
    const topicData: Record<string, { totalPct: number, count: number, name: string }> = {};

    enrolledSubjects.forEach((sub: any) => {
      subjectData[sub.id] = { totalPct: 0, count: 0, name: sub.name };
    });

    attempts.forEach((a: any) => {
      const pct = (a.correct_answers / Math.max(a.total_questions, 1)) * 100;

      // Subjects map
      if (!subjectData[a.subject_id]) subjectData[a.subject_id] = { totalPct: 0, count: 0, name: a.subject.name };
      subjectData[a.subject_id].totalPct += pct;
      subjectData[a.subject_id].count++;

      // Topics map
      if (!topicData[a.topic_id]) topicData[a.topic_id] = { totalPct: 0, count: 0, name: a.topic.name };
      topicData[a.topic_id].totalPct += pct;
      topicData[a.topic_id].count++;
    });

    const parsedSubjects = Object.values(subjectData).map((s: any) => ({
      subject_name: s.name,
      average_accuracy: s.count > 0 ? Math.round(s.totalPct / s.count) : 0
    }));

    const parsedTopics = Object.values(topicData).map((t: any) => ({
      topic_name: t.name,
      average_accuracy: Math.round(t.totalPct / t.count)
    }));

    const weakTopics = parsedTopics.filter((t: any) => t.average_accuracy < 40);

    // Calculate overall preparedness (average of subjects)
    const overallPreparedness = parsedSubjects.length > 0
      ? Math.round(parsedSubjects.reduce((acc: number, curr: any) => acc + curr.average_accuracy, 0) / parsedSubjects.length)
      : 0;

    res.json({
      preparedness: overallPreparedness,
      subject_wise_performance: parsedSubjects,
      topic_wise_performance: parsedTopics,
      weak_topics: weakTopics
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student analytics' });
  }
});

export default router;
