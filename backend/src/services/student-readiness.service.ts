import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../prisma';

export class StudentReadinessService {
  
  static async getAttendance(studentId: string, organizationId: string, academicYearId: string) {
    const attendances = await prisma.studentAttendance.findMany({
      where: { 
        student_id: studentId, 
        organization_id: organizationId,
        academic_year_id: academicYearId
      }
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
      where: { 
        grade_id: gradeId, 
        organization_id: organizationId, 
        OR: [
          { is_active: true },
          { is_active: { not: false } }
        ]
      }
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

      let p1Node: any = null;
      let p2Node: any = null;
      let p3Node: any = null;

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

          if (score < 80 && !p2Node) {
            p2Node = node;
          } else if (score >= 80 && !p3Node) {
            p3Node = node;
          }
        } else {
          if (!p1Node) p1Node = node;
        }
      }

      const nextNode = p1Node || p2Node || p3Node;

      const coverage = topicTotal > 0 
        ? (topicCompleted / topicTotal) * 100 
        : unitTotal > 0 
        ? (unitCompleted / unitTotal) * 100 
        : 0;

      const accuracy = attemptedSets > 0 ? (totalAccuracySum / attemptedSets) : 0;
      
      let readiness = 0;
      if (attemptedSets === 0) {
        readiness = coverage * 0.8;
      } else {
        readiness = (coverage * 0.5) + (accuracy * 0.5);
      }

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
        masteredSets,
        nextNode
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
      const assessmentSets = new Map<string, { type: string, id: string, subjectName: string, subjectId: string }>();

      subjectQuestions.forEach((q: any) => {
        if (q.sub_topic_id) assessmentSets.set(`subtopic_${q.sub_topic_id}`, { type: 'subtopic', id: q.sub_topic_id, subjectName: sub.subjectName, subjectId: sub.subjectId });
        else if (q.topic_id) assessmentSets.set(`topic_${q.topic_id}`, { type: 'topic', id: q.topic_id, subjectName: sub.subjectName, subjectId: sub.subjectId });
        else if (q.unit_id) assessmentSets.set(`unit_${q.unit_id}`, { type: 'unit', id: q.unit_id, subjectName: sub.subjectName, subjectId: sub.subjectId });
        else assessmentSets.set(`subject_${q.subject_id}`, { type: 'subject', id: q.subject_id!, subjectName: sub.subjectName, subjectId: sub.subjectId });
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
          
          if (score < 80 && !p2Node) {
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
        subjectId: analytics[0].subjectId,
        title: "General Practice",
        reason: "Keep practicing",
        priority: "None",
        readinessImpact: 1,
        actionUrl: `/student/academics/mcq?subject_id=${analytics[0].subjectId}`
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
      subjectId: selectedNode.subjectId,
      title: title,
      reason: selectedNode.reason,
      priority: selectedNode.priority,
      readinessImpact: selectedNode.score < 35 ? 15 : (selectedNode.score < 80 ? 10 : 5),
      actionUrl: `/student/academics/mcq?subject_id=${selectedNode.subjectId}&subject_name=${selectedNode.subjectName}`
    };
  }

  static async getKPIs(studentId: string, organizationId: string, academicYearId: string) {
    const analytics = await this.getSubjectAnalytics(studentId, organizationId, academicYearId);
    
    let totalReadiness = 0;
    let totalCoverage = 0;
    let assessmentParticipation = 0;

    if (analytics.length > 0) {
      let totalTopicsCompleted = 0;
      let totalTopicsAvailable = 0;
      let globalAttemptedSets = 0;
      let globalTotalSets = 0;
      let globalAccuracySum = 0;

      analytics.forEach((s: any) => {
        const completed = s.topicTotal > 0 ? s.topicCompleted : s.unitCompleted;
        const total = s.topicTotal > 0 ? s.topicTotal : s.unitTotal;
        
        totalTopicsCompleted += completed;
        totalTopicsAvailable += total;
        
        globalAttemptedSets += s.attemptedSets;
        globalTotalSets += s.totalAssessmentSets;
        
        globalAccuracySum += (s.accuracy * s.attemptedSets);
      });

      totalCoverage = totalTopicsAvailable > 0 ? (totalTopicsCompleted / totalTopicsAvailable) * 100 : 0;
      assessmentParticipation = globalTotalSets > 0 ? (globalAttemptedSets / globalTotalSets) * 100 : 0;
      
      const globalAccuracy = globalAttemptedSets > 0 ? (globalAccuracySum / globalAttemptedSets) : 0;

      if (globalAttemptedSets === 0) {
        totalReadiness = totalCoverage * 0.8;
      } else {
        totalReadiness = (totalCoverage * 0.5) + (globalAccuracy * 0.5);
      }
    }

    const weakSubject = await this.getWeakSubject(studentId, organizationId, academicYearId);
    const attendanceData = await this.getAttendance(studentId, organizationId, academicYearId);

    return {
      readyForExam: Number(totalReadiness.toFixed(1)),
      subjects: analytics.length,
      weakSubject: weakSubject,
      curriculumCoverage: Number(totalCoverage.toFixed(1)),
      attendance: attendanceData.attendancePercentage,
      assessmentParticipation: Number(assessmentParticipation.toFixed(1))
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
      where: { 
        grade_id: gradeId, 
        organization_id: organizationId, 
        OR: [
          { is_active: true },
          { is_active: { not: false } }
        ]
      }
    });
    
    const units = await prisma.unit.findMany({ where: { organization_id: organizationId } });
    const topics = await prisma.topic.findMany({ where: { organization_id: organizationId } });

    let globalTopicsTotal = 0;
    const subjectItems = new Map<string, { topics: any[], units: any[] }>();
    subjects.forEach((s: any) => {
      const subjectUnits = units.filter((u: any) => u.subject_id === s.id);
      const subjectTopics = topics.filter((t: any) => subjectUnits.some((u: any) => u.id === t.unit_id));
      subjectItems.set(s.id, { topics: subjectTopics, units: subjectUnits });
      const total = subjectTopics.length > 0 ? subjectTopics.length : subjectUnits.length;
      globalTopicsTotal += total;
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

    const subjectIds = new Set(subjects.map((s: any) => s.id));
    const validSets = Array.from(assessmentSets.values()).filter(set => subjectIds.has(set.subjectId));
    
    const allAttempts = await prisma.studentAssessmentAttempt.findMany({
      where: { student_id: studentId, organization_id: organizationId }
    });

    const allCompletions = await prisma.completionTracking.findMany({
      where: {
        organization_id: organizationId,
        academic_year_id: academicYearId,
        grade_id: gradeId,
        is_completed: true,
        OR: [
          { section_id: enrollments[0].section_id },
          { section_id: null }
        ]
      }
    });

    const trends = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
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

      const attemptsUpToWeek = allAttempts.filter((a: any) => new Date(a.start_time) <= weekEnd);
      const completionsUpToWeek = allCompletions.filter((c: any) => c.completed_at && new Date(c.completed_at) <= weekEnd);

      let globalTopicsCompleted = 0;
      subjects.forEach((s: any) => {
        const sItems = subjectItems.get(s.id);
        if (!sItems) return;
        const topicTotal = sItems.topics.length;
        const topicCompleted = completionsUpToWeek.filter((c: any) => c.subject_id === s.id && c.completion_level === 'TOPIC').length;
        const unitCompleted = completionsUpToWeek.filter((c: any) => c.subject_id === s.id && c.completion_level === 'UNIT').length;
        globalTopicsCompleted += topicTotal > 0 ? topicCompleted : unitCompleted;
      });

      const coverage = globalTopicsTotal > 0 ? (globalTopicsCompleted / globalTopicsTotal) * 100 : 0;

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

      const accuracy = attemptedSets > 0 ? (totalAccuracySum / attemptedSets) : 0;
      
      let readiness = 0;
      if (attemptedSets === 0) {
        readiness = coverage * 0.8;
      } else {
        readiness = (coverage * 0.5) + (accuracy * 0.5);
      }

      trends.push({
        week: weekStart,
        readiness: Number(readiness.toFixed(1)),
        coverage: Number(coverage.toFixed(1)),
        accuracy: Number(accuracy.toFixed(1))
      });
    }

    return trends;
  }

  static async getExaminationAnalytics(studentId: string, organizationId: string, academicYearId: string) {
    const results = await prisma.studentExamResult.findMany({
      where: {
        student_id: studentId,
        examination: {
          organization_id: organizationId,
          academic_year_id: academicYearId
        }
      },
      include: {
        examination: true,
        subject_results: {
          include: {
            subject: true
          }
        }
      },
      orderBy: {
        examination: {
          created_at: 'asc'
        }
      }
    });

    if (results.length === 0) {
      return {
        summary: null,
        history: [],
        subjects: []
      };
    }

    const history = results.map((r: any) => ({
      examName: r.examination.exam_name,
      percentage: r.percentage,
      date: r.examination.created_at
    }));

    const latestResult = results[results.length - 1];

    const subjects = latestResult.subject_results.map((sr: any) => {
      let percentage = 0;
      if (sr.max_marks && sr.max_marks > 0 && sr.obtained_marks != null) {
        percentage = Number(((sr.obtained_marks / sr.max_marks) * 100).toFixed(1));
      }
      return {
        subjectName: sr.subject?.name || 'Unknown Subject',
        obtainedMarks: sr.obtained_marks,
        maxMarks: sr.max_marks,
        percentage: percentage
      };
    });

    const summary = {
      examName: latestResult.examination.exam_name,
      totalObtainedMarks: latestResult.total_obtained_marks,
      totalMaxMarks: latestResult.total_max_marks,
      percentage: latestResult.percentage
    };

    return {
      summary,
      history,
      subjects
    };
  }
}
