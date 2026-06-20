import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../prisma';

export class StudentReadinessService {
  
  static async getAttendance(studentId: string, organizationId: string, academicYearId: string) {
    const attendances = await prisma.studentAttendance.findMany({
      where: { student_id: studentId, organization_id: organizationId }
    });

    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    attendances.forEach((a: any) => {
      if (a.status === 'PRESENT' || a.status === 'HALF_DAY') present++;
      else if (a.status === 'LATE') late++;
      else if (a.status === 'ABSENT') absent++;
      else if (a.status === 'EXCUSED') excused++;
    });

    const total = attendances.length;
    const denominator = total - excused;
    const attendancePercentage = denominator > 0 ? ((present + late) / denominator) * 100 : 0;

    return {
      attendancePercentage: Number(attendancePercentage.toFixed(1)),
      present,
      absent,
      late,
      excused
    };
  }

  static async getSubjectAnalytics(studentId: string, organizationId: string, academicYearId: string) {
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { student_id: studentId, organization_id: organizationId, academic_year_id: academicYearId },
      include: { grade: true }
    });
    
    if (!enrollments.length) return [];
    
    const gradeId = enrollments[0].grade_id;

    const subjects = await prisma.subject.findMany({
      where: { grade_id: gradeId, organization_id: organizationId }
    });

    const units = await prisma.unit.findMany({ where: { organization_id: organizationId } });
    const topics = await prisma.topic.findMany({ where: { organization_id: organizationId } });
    const subtopics = await prisma.subTopic.findMany({ where: { organization_id: organizationId } });
    
    const completions = await prisma.completionTracking.findMany({
      where: {
        organization_id: organizationId,
        academic_year_id: academicYearId,
        grade_id: enrollments[0].grade_id,
        is_completed: true,
        OR: [
          { section_id: enrollments[0].section_id },
          { section_id: null }
        ]
      }
    });

    const questions = await prisma.question.findMany({
      where: { organization_id: organizationId },
      select: { subject_id: true, unit_id: true, topic_id: true, sub_topic_id: true }
    });

    const attempts = await prisma.studentAssessmentAttempt.findMany({
      where: { student_id: studentId, organization_id: organizationId }
    });

    const results = [];

    for (const subject of subjects) {
      const subjectUnits = units.filter((u: any) => u.subject_id === subject.id);
      const subjectTopics = topics.filter((t: any) => subjectUnits.some((u: any) => u.id === t.unit_id));
      const subjectSubTopics = subtopics.filter((st: any) => subjectTopics.some((t: any) => t.id === st.topic_id));

      const unitTotal = subjectUnits.length;
      const topicTotal = subjectTopics.length;
      const subtopicTotal = subjectSubTopics.length;

      const unitCompleted = completions.filter((c: any) => c.subject_id === subject.id && c.completion_level === 'UNIT').length;
      const topicCompleted = completions.filter((c: any) => c.subject_id === subject.id && c.completion_level === 'TOPIC').length;
      const subtopicCompleted = completions.filter((c: any) => c.subject_id === subject.id && (c.completion_level === 'SUBTOPIC' || c.completion_level === 'SUB_TOPIC')).length;

      const subjectQuestions = questions.filter((q: any) => q.subject_id === subject.id);
      const assessmentSets = new Map<string, { type: string, id: string }>();

      subjectQuestions.forEach((q: any) => {
        if (q.sub_topic_id) assessmentSets.set(`subtopic_${q.sub_topic_id}`, { type: 'subtopic', id: q.sub_topic_id });
        else if (q.topic_id) assessmentSets.set(`topic_${q.topic_id}`, { type: 'topic', id: q.topic_id });
        else if (q.unit_id) assessmentSets.set(`unit_${q.unit_id}`, { type: 'unit', id: q.unit_id });
        else assessmentSets.set(`subject_${q.subject_id}`, { type: 'subject', id: q.subject_id! });
      });

      const totalAssessmentSets = assessmentSets.size;
      let attemptedSets = 0;
      let completedSets = 0;
      let masteredSets = 0;
      let totalAccuracySum = 0;

      const subjectAttempts = attempts.filter((a: any) => a.subject_id === subject.id);

      for (const [key, node] of assessmentSets.entries()) {
        let setAttempts = [];
        if (node.type === 'subtopic') setAttempts = subjectAttempts.filter((a: any) => a.sub_topic_id === node.id);
        else if (node.type === 'topic') setAttempts = subjectAttempts.filter((a: any) => a.topic_id === node.id && !a.sub_topic_id);
        else if (node.type === 'unit') setAttempts = subjectAttempts.filter((a: any) => a.unit_id === node.id && !a.topic_id && !a.sub_topic_id);
        else setAttempts = subjectAttempts.filter((a: any) => a.subject_id === node.id && !a.unit_id && !a.topic_id && !a.sub_topic_id);

        if (setAttempts.length > 0) {
          attemptedSets++;
          const bestAttempt = setAttempts.reduce((prev: any, curr: any) => {
            const prevScore = prev.total_questions > 0 ? prev.correct_answers / prev.total_questions : 0;
            const currScore = curr.total_questions > 0 ? curr.correct_answers / curr.total_questions : 0;
            return currScore > prevScore ? curr : prev;
          });
          const score = bestAttempt.total_questions > 0 ? (bestAttempt.correct_answers / bestAttempt.total_questions) * 100 : 0;
          totalAccuracySum += score;
          
          if (score >= 35) completedSets++;
          if (score >= 80) masteredSets++;
        }
      }

      const coverage = totalAssessmentSets > 0 ? (attemptedSets / totalAssessmentSets) * 100 : 0;
      const accuracy = attemptedSets > 0 ? (totalAccuracySum / attemptedSets) : 0;
      const readiness = (coverage + accuracy) / 2;

      results.push({
        subjectId: subject.id,
        subjectName: subject.name,
        unitCompleted,
        unitTotal,
        topicCompleted,
        topicTotal,
        subtopicCompleted,
        subtopicTotal,
        coverage: Number(coverage.toFixed(1)),
        accuracy: Number(accuracy.toFixed(1)),
        readiness: Number(readiness.toFixed(1)),
        totalAssessmentSets,
        attemptedSets,
        completedSets,
        masteredSets
      });
    }

    return results;
  }

  static async getWeakSubject(studentId: string, organizationId: string, academicYearId: string) {
    const analytics = await this.getSubjectAnalytics(studentId, organizationId, academicYearId);
    
    let eligibleSubjects = analytics.filter((s: any) => s.attemptedSets >= 3 || s.coverage >= 10);
    
    if (eligibleSubjects.length === 0) {
      return "Not Enough Data";
    }

    eligibleSubjects.sort((a: any, b: any) => a.readiness - b.readiness);
    return eligibleSubjects[0].subjectName;
  }

  static async getContinueLearning(studentId: string, organizationId: string, academicYearId: string) {
    const analytics = await this.getSubjectAnalytics(studentId, organizationId, academicYearId);
    if (!analytics.length) return null;

    const questions = await prisma.question.findMany({
      where: { organization_id: organizationId },
      select: { subject_id: true, unit_id: true, topic_id: true, sub_topic_id: true }
    });

    const attempts = await prisma.studentAssessmentAttempt.findMany({
      where: { student_id: studentId, organization_id: organizationId }
    });

    let p1Node: any = null;
    let p2Node: any = null;
    let p3Node: any = null;

    for (const sub of analytics) {
      const subjectQuestions = questions.filter((q: any) => q.subject_id === sub.subjectId);
      const assessmentSets = new Map<string, { type: string, id: string, subjectName: string }>();

      subjectQuestions.forEach((q: any) => {
        if (q.sub_topic_id) assessmentSets.set(`subtopic_${q.sub_topic_id}`, { type: 'subtopic', id: q.sub_topic_id, subjectName: sub.subjectName });
        else if (q.topic_id) assessmentSets.set(`topic_${q.topic_id}`, { type: 'topic', id: q.topic_id, subjectName: sub.subjectName });
        else if (q.unit_id) assessmentSets.set(`unit_${q.unit_id}`, { type: 'unit', id: q.unit_id, subjectName: sub.subjectName });
        else assessmentSets.set(`subject_${q.subject_id}`, { type: 'subject', id: q.subject_id!, subjectName: sub.subjectName });
      });

      const subjectAttempts = attempts.filter((a: any) => a.subject_id === sub.subjectId);

      for (const [key, node] of assessmentSets.entries()) {
        let setAttempts = [];
        if (node.type === 'subtopic') setAttempts = subjectAttempts.filter((a: any) => a.sub_topic_id === node.id);
        else if (node.type === 'topic') setAttempts = subjectAttempts.filter((a: any) => a.topic_id === node.id && !a.sub_topic_id);
        else if (node.type === 'unit') setAttempts = subjectAttempts.filter((a: any) => a.unit_id === node.id && !a.topic_id && !a.sub_topic_id);
        else setAttempts = subjectAttempts.filter((a: any) => a.subject_id === node.id && !a.unit_id && !a.topic_id && !a.sub_topic_id);

        if (setAttempts.length === 0) {
          if (!p1Node) p1Node = { ...node, score: 0, reason: "Incomplete Assessment", priority: "Incomplete" };
        } else {
          const bestAttempt = setAttempts.reduce((prev: any, curr: any) => {
            const prevScore = prev.total_questions > 0 ? prev.correct_answers / prev.total_questions : 0;
            const currScore = curr.total_questions > 0 ? curr.correct_answers / curr.total_questions : 0;
            return currScore > prevScore ? curr : prev;
          });
          const score = bestAttempt.total_questions > 0 ? (bestAttempt.correct_answers / bestAttempt.total_questions) * 100 : 0;
          
          if (score < 35 && !p1Node) {
            p1Node = { ...node, score, reason: "Incomplete Assessment", priority: "Incomplete" };
          } else if (score >= 35 && score < 80 && !p2Node) {
            p2Node = { ...node, score, reason: "Needs Improvement", priority: "Needs Improvement" };
          } else if (score >= 80 && !p3Node) {
            p3Node = { ...node, score, reason: "Revision", priority: "Revision" };
          }
        }
      }
    }

    const selectedNode = p1Node || p2Node || p3Node;

    if (!selectedNode) {
      return {
        subject: analytics[0].subjectName,
        title: "General Practice",
        reason: "Keep practicing",
        priority: "None",
        readinessImpact: 1,
        actionUrl: `/student/practice?subject=${analytics[0].subjectId}`
      };
    }

    let title = "Assessment";
    if (selectedNode.type === 'subtopic') {
      const st = await prisma.subTopic.findUnique({ where: { id: selectedNode.id } });
      if (st) title = st.name;
    } else if (selectedNode.type === 'topic') {
      const t = await prisma.topic.findUnique({ where: { id: selectedNode.id } });
      if (t) title = t.name;
    } else if (selectedNode.type === 'unit') {
      const u = await prisma.unit.findUnique({ where: { id: selectedNode.id } });
      if (u) title = u.name;
    }

    return {
      subject: selectedNode.subjectName,
      title: title,
      reason: selectedNode.reason,
      priority: selectedNode.priority,
      readinessImpact: selectedNode.score < 35 ? 15 : (selectedNode.score < 80 ? 10 : 5),
      actionUrl: `/student/assessment/take/${selectedNode.id}?type=${selectedNode.type}`
    };
  }

  static async getKPIs(studentId: string, organizationId: string, academicYearId: string) {
    const analytics = await this.getSubjectAnalytics(studentId, organizationId, academicYearId);
    
    let totalReadiness = 0;
    let totalCoverage = 0;
    if (analytics.length > 0) {
      totalReadiness = analytics.reduce((acc: any, curr: any) => acc + curr.readiness, 0) / analytics.length;
      totalCoverage = analytics.reduce((acc: any, curr: any) => acc + curr.coverage, 0) / analytics.length;
    }

    const weakSubject = await this.getWeakSubject(studentId, organizationId, academicYearId);
    const attendanceData = await this.getAttendance(studentId, organizationId, academicYearId);

    return {
      readyForExam: Number(totalReadiness.toFixed(1)),
      subjects: analytics.length,
      weakSubject: weakSubject,
      curriculumCoverage: Number(totalCoverage.toFixed(1)),
      attendance: attendanceData.attendancePercentage
    };
  }
  
  static async getWeeklyTrend(studentId: string, organizationId: string, academicYearId: string) {
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { student_id: studentId, organization_id: organizationId, academic_year_id: academicYearId },
      include: { grade: true }
    });
    
    if (!enrollments.length) return [];

    const gradeId = enrollments[0].grade_id;
    const subjects = await prisma.subject.findMany({
      where: { grade_id: gradeId, organization_id: organizationId }
    });
    const questions = await prisma.question.findMany({
      where: { organization_id: organizationId },
      select: { subject_id: true, unit_id: true, topic_id: true, sub_topic_id: true }
    });

    const assessmentSets = new Map<string, { type: string, id: string, subjectId: string }>();
    questions.forEach((q: any) => {
      if (q.sub_topic_id) assessmentSets.set(`subtopic_${q.sub_topic_id}`, { type: 'subtopic', id: q.sub_topic_id, subjectId: q.subject_id });
      else if (q.topic_id) assessmentSets.set(`topic_${q.topic_id}`, { type: 'topic', id: q.topic_id, subjectId: q.subject_id });
      else if (q.unit_id) assessmentSets.set(`unit_${q.unit_id}`, { type: 'unit', id: q.unit_id, subjectId: q.subject_id });
      else assessmentSets.set(`subject_${q.subject_id}`, { type: 'subject', id: q.subject_id!, subjectId: q.subject_id });
    });

    // Filter sets to only enrolled subjects
    const subjectIds = new Set(subjects.map((s: any) => s.id));
    const validSets = Array.from(assessmentSets.values()).filter(set => subjectIds.has(set.subjectId));
    const totalValidSets = validSets.length;

    const allAttempts = await prisma.studentAssessmentAttempt.findMany({
      where: { student_id: studentId, organization_id: organizationId }
    });

    // Generate 8 weeks ending on Sundays
    const trends = [];
    const now = new Date();
    // find most recent Sunday at 23:59:59
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const daysSinceSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
    
    const latestSunday = new Date(now);
    latestSunday.setDate(latestSunday.getDate() - daysSinceSunday);
    latestSunday.setHours(23, 59, 59, 999);

    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(latestSunday);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      // Filter attempts up to this weekEnd
      const attemptsUpToWeek = allAttempts.filter((a: any) => new Date(a.start_time) <= weekEnd);

      let attemptedSets = 0;
      let totalAccuracySum = 0;

      for (const node of validSets) {
        let setAttempts = [];
        if (node.type === 'subtopic') setAttempts = attemptsUpToWeek.filter((a: any) => a.sub_topic_id === node.id);
        else if (node.type === 'topic') setAttempts = attemptsUpToWeek.filter((a: any) => a.topic_id === node.id && !a.sub_topic_id);
        else if (node.type === 'unit') setAttempts = attemptsUpToWeek.filter((a: any) => a.unit_id === node.id && !a.topic_id && !a.sub_topic_id);
        else setAttempts = attemptsUpToWeek.filter((a: any) => a.subject_id === node.id && !a.unit_id && !a.topic_id && !a.sub_topic_id);

        if (setAttempts.length > 0) {
          attemptedSets++;
          const bestAttempt = setAttempts.reduce((prev: any, curr: any) => {
            const prevScore = prev.total_questions > 0 ? prev.correct_answers / prev.total_questions : 0;
            const currScore = curr.total_questions > 0 ? curr.correct_answers / curr.total_questions : 0;
            return currScore > prevScore ? curr : prev;
          });
          const score = bestAttempt.total_questions > 0 ? (bestAttempt.correct_answers / bestAttempt.total_questions) * 100 : 0;
          totalAccuracySum += score;
        }
      }

      const coverage = totalValidSets > 0 ? (attemptedSets / totalValidSets) * 100 : 0;
      const accuracy = attemptedSets > 0 ? (totalAccuracySum / attemptedSets) : 0;
      const readiness = (coverage + accuracy) / 2;

      trends.push({
        week: weekStart, // Represent week by its start date (Monday)
        readiness: Number(readiness.toFixed(1)),
        coverage: Number(coverage.toFixed(1)),
        accuracy: Number(accuracy.toFixed(1))
      });
    }

    return trends;
  }
}
