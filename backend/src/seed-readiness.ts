import { PrismaClient } from '@prisma/client';
import { StudentReadinessService } from './services/student-readiness.service';

const prisma = new PrismaClient();

async function run() {
  console.log('\n--- Final Academic Readiness Validation & Seed Implementation ---');

  const gokuls = await prisma.user.findMany({ where: { name: 'Gokul Sharma' }, include: { enrollments: true } });
  const haris = await prisma.user.findMany({ where: { name: 'Hari Reddy' }, include: { enrollments: true } });

  const gokul = gokuls.find(u => u.enrollments.length > 0);
  const hari = haris.find(u => u.enrollments.length > 0);

  if (!gokul || !hari) {
    console.error('Students not found with active enrollments.');
    process.exit(1);
  }

  const students = [
    { name: 'Gokul Sharma', user: gokul, strongSubject: 'Physics', weakSubject: 'Tamil' },
    { name: 'Hari Reddy', user: hari, strongSubject: 'Mathematics', weakSubject: 'Science' }
  ];

  for (const s of students) {
    const userId = s.user.id;
    const orgId = s.user.organization_id;
    const enrollment = s.user.enrollments[0];
    const academicYearId = enrollment.academic_year_id;
    const gradeId = enrollment.grade_id;

    console.log(`\n================================================================`);
    console.log(`Executing Execution Order for: ${s.name}`);
    console.log(`================================================================`);

    // Determine actual enrolled subjects
    let subjects = [];
    if (enrollment.subject_group_id) {
      const sgs = await prisma.subjectGroupSubject.findMany({ 
        where: { group_id: enrollment.subject_group_id }, 
        include: { subject: true } 
      });
      subjects = sgs.map(sg => sg.subject);
    } else {
      subjects = await prisma.subject.findMany({ 
        where: { grade_id: gradeId, organization_id: orgId } 
      });
    }

    if (subjects.length === 0) {
      console.log('No subjects found for this student. Defaulting to all grade subjects.');
      subjects = await prisma.subject.findMany({ 
        where: { grade_id: gradeId, organization_id: orgId } 
      });
    }

    // Phase 0 - Seed Missing Curriculum
    for (const sub of subjects) {
      const existingQs = await prisma.question.count({ where: { subject_id: sub.id } });
      if (existingQs === 0) {
        console.log(`Seeding curriculum for ${sub.name}...`);
        const unit = await prisma.unit.create({
          data: {
            organization_id: orgId,
            subject_id: sub.id,
            name: `${sub.name} Unit 1`,
            order_index: 1
          }
        });
        const topic = await prisma.topic.create({
          data: {
            organization_id: orgId,
            unit_id: unit.id,
            name: `${sub.name} Topic 1`,
            order_index: 1
          }
        });
        for (let i = 1; i <= 5; i++) {
          const st = await prisma.subTopic.create({
            data: {
              organization_id: orgId,
              topic_id: topic.id,
              name: `${sub.name} Subtopic ${i}`,
              order_index: i
            }
          });
          // Seed 10 questions for this subtopic
          const qsToInsert: any[] = [];
          for (let q = 0; q < 10; q++) {
            qsToInsert.push({
              organization_id: orgId,
              subject_id: sub.id,
              unit_id: unit.id,
              topic_id: topic.id,
              sub_topic_id: st.id,
              type: 'MCQ_SINGLE',
              difficulty: 'MEDIUM',
              marks: 1,
              created_by: userId,
              question_text: `Sample question ${q+1} for ${st.name}`
            });
          }
          await prisma.question.createMany({ data: qsToInsert });
        }
      }
    }

    // Phase 1 - Assessment Set Discovery
    console.log('\nPhase 1: Assessment Discovery');
    const questions = await prisma.question.findMany({ where: { organization_id: orgId } });
    
    const assessmentSetsBySubject = new Map<string, any[]>();
    for (const sub of subjects) {
      const subQuestions = questions.filter(q => q.subject_id === sub.id);
      const setsMap = new Map<string, any>();
      subQuestions.forEach(q => {
        if (q.sub_topic_id) setsMap.set(`subtopic_${q.sub_topic_id}`, { type: 'SUBTOPIC', id: q.sub_topic_id, subjectId: q.subject_id, unitId: q.unit_id, topicId: q.topic_id, subtopicId: q.sub_topic_id });
        else if (q.topic_id) setsMap.set(`topic_${q.topic_id}`, { type: 'TOPIC', id: q.topic_id, subjectId: q.subject_id, unitId: q.unit_id, topicId: q.topic_id, subtopicId: null });
        else if (q.unit_id) setsMap.set(`unit_${q.unit_id}`, { type: 'UNIT', id: q.unit_id, subjectId: q.subject_id, unitId: q.unit_id, topicId: null, subtopicId: null });
        else setsMap.set(`subject_${q.subject_id}`, { type: 'SUBJECT', id: q.subject_id, subjectId: q.subject_id, unitId: null, topicId: null, subtopicId: null });
      });
      const sets = Array.from(setsMap.values());
      assessmentSetsBySubject.set(sub.id, sets);

      let uCount=0, tCount=0, stCount=0, subCount=0;
      sets.forEach(set => {
        if (set.type === 'UNIT') uCount++;
        else if (set.type === 'TOPIC') tCount++;
        else if (set.type === 'SUBTOPIC') stCount++;
        else if (set.type === 'SUBJECT') subCount++;
      });
      console.log(`- ${sub.name}: Units=${uCount}, Topics=${tCount}, Subtopics=${stCount}, SubjectSets=${subCount} -> Total=${sets.length}`);
    }

    // Phase 2 - Attendance Seeding
    console.log('\nPhase 2: Attendance Seeding');
    await prisma.studentAttendance.deleteMany({ where: { student_id: userId, organization_id: orgId } });

    const now = new Date();
    const attendancesToInsert = [];
    const distribution = [
      ...Array(135).fill('PRESENT'),
      ...Array(8).fill('ABSENT'),
      ...Array(5).fill('LATE'),
      ...Array(2).fill('EXCUSED')
    ];
    distribution.sort(() => Math.random() - 0.5);

    const phase = await prisma.attendancePhase.findFirst({ where: { organization_id: orgId } });
    const phaseId = phase ? phase.id : '00000000-0000-0000-0000-000000000000';

    for (let i = 0; i < 150; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (150 - i));
      attendancesToInsert.push({
        student_id: userId,
        organization_id: orgId,
        academic_year_id: academicYearId,
        grade_id: gradeId,
        section_id: enrollment.section_id,
        phase_id: phaseId,
        attendance_date: d,
        status: distribution[i],
        marked_by: userId
      });
    }
    await prisma.studentAttendance.createMany({ data: attendancesToInsert });
    console.log(`Seeded 150 attendance records.`);

    // Phase 3 & 4 - Assessment Attempt Seeding & Strong/Weak Subject Profiles
    console.log('\nPhase 3 & 4: Assessment Attempt Seeding (Profiles)');
    await prisma.studentAssessmentAttempt.deleteMany({ where: { student_id: userId, organization_id: orgId } });

    // Ensure we delete direct weekly trends from previous seeds (Rule 2)
    await prisma.studentDashboardWeeklyTrend.deleteMany({ where: { student_id: userId, organization_id: orgId } });

    const attemptsToInsert: any[] = [];
    
    // Phase 8 - Weekly Trend Generation (Monday to Sunday, last 8 weeks)
    // We will generate attempts spread across the last 8 weeks
    const weeksAgo = (weeks: number) => {
      const d = new Date();
      // Go to nearest past Sunday
      const dayOfWeek = d.getDay(); // 0 is Sunday
      const daysToSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
      d.setDate(d.getDate() - daysToSunday);
      d.setHours(23, 59, 59, 999); // End of current week
      d.setDate(d.getDate() - (weeks * 7)); // Go back `weeks` weeks
      // Go to middle of that week (e.g. Wednesday) to place the attempt
      d.setDate(d.getDate() - 3); 
      return d;
    };

    for (const sub of subjects) {
      const sets = assessmentSetsBySubject.get(sub.id) || [];
      if (sets.length === 0) continue;

      let targetCoverage = 0.65;
      let targetAccuracyBase = 0.75;
      
      if (sub.name === s.strongSubject) {
        targetCoverage = 0.90;
        targetAccuracyBase = 0.85;
      } else if (sub.name === s.weakSubject) {
        targetCoverage = 0.30;
        targetAccuracyBase = 0.40;
      } else {
        targetCoverage = 0.55 + Math.random() * 0.20;
        targetAccuracyBase = 0.65 + Math.random() * 0.15;
      }

      const numSetsToAttempt = Math.floor(sets.length * targetCoverage);
      
      for (let i = 0; i < numSetsToAttempt; i++) {
        const set = sets[i];
        const finalAccuracy = Math.min(1.0, Math.max(0.1, targetAccuracyBase + (Math.random() * 0.2 - 0.1)));
        const totalQ = 10;
        const correctQ = Math.round(finalAccuracy * totalQ);

        // Phase 5 - Highest Attempt Validation
        const numAttempts = 1 + Math.floor(Math.random() * 3);
        for (let a = 0; a < numAttempts; a++) {
          const isHighest = a === numAttempts - 1;
          const attemptCorrect = isHighest ? correctQ : Math.max(0, correctQ - Math.floor(Math.random() * 4) - 1);
          
          // Distribute date between 7 weeks ago and 0 weeks ago
          const weekOffset = 7 - Math.floor((i / numSetsToAttempt) * 7); 
          const attemptDate = weeksAgo(weekOffset);
          
          // Add slight offset for retries
          attemptDate.setHours(attemptDate.getHours() + a);

          attemptsToInsert.push({
            student_id: userId,
            organization_id: orgId,
            subject_id: set.subjectId,
            unit_id: set.unitId,
            topic_id: set.topicId,
            sub_topic_id: set.subtopicId,
            total_questions: totalQ,
            correct_answers: attemptCorrect,
            start_time: attemptDate,
            end_time: attemptDate,
            created_at: attemptDate,
            updated_at: attemptDate
          });
        }

        // Phase 6 - Coverage Validation
        if (set.type === 'SUBTOPIC') await createCompletion(orgId, academicYearId, gradeId, enrollment.section_id, set.subjectId, set.unitId, set.topicId, set.subtopicId, 'SUBTOPIC');
        else if (set.type === 'TOPIC') await createCompletion(orgId, academicYearId, gradeId, enrollment.section_id, set.subjectId, set.unitId, set.topicId, null, 'TOPIC');
        else if (set.type === 'UNIT') await createCompletion(orgId, academicYearId, gradeId, enrollment.section_id, set.subjectId, set.unitId, null, null, 'UNIT');
      }
    }

    if (attemptsToInsert.length > 0) {
      await prisma.studentAssessmentAttempt.createMany({ data: attemptsToInsert });
    }
    console.log(`Seeded ${attemptsToInsert.length} attempts across 8 weeks.`);

    // ==========================================
    // Phase 9 & 10 - Post Seed Validation & Report
    // ==========================================
    console.log('\nPhase 9: Post Seed Validation');
    const attendance = await StudentReadinessService.getAttendance(userId, orgId, academicYearId);
    console.log(`- Attendance: ${attendance.attendancePercentage}%`);

    const kpis = await StudentReadinessService.getKPIs(userId, orgId, academicYearId);
    console.log(`- Overall Coverage: ${kpis.curriculumCoverage}%`);
    console.log(`- Overall Readiness: ${kpis.readyForExam}%`);
    console.log(`- Weak Subject Identified: ${kpis.weakSubject}`);

    // Phase 7 Verification
    console.log('\nPhase 7: Continue Learning Validation');
    const continueLearning = await StudentReadinessService.getContinueLearning(userId, orgId, academicYearId);
    console.log(`- Priority Selected: ${continueLearning?.priority || 'None'}`);
    console.log(`- Subject: ${continueLearning?.subject}`);

    // Phase 8 Verification
    console.log('\nPhase 8: Weekly Trend Generation Validation');
    const trends = await StudentReadinessService.getWeeklyTrend(userId, orgId, academicYearId);
    console.log(`Generated ${trends.length} weekly trend data points dynamically.`);

    console.log('\nPhase 10: Subject Readiness Validation Report');
    const analytics = await StudentReadinessService.getSubjectAnalytics(userId, orgId, academicYearId);
    
    console.table(analytics.map((a: any) => ({
      Subject: a.subjectName,
      'Assessment Enabled Sets': a.totalAssessmentSets,
      'Attempted Sets': a.attemptedSets,
      'Completed Sets (>=35%)': a.completedSets,
      'Mastered Sets (>=80%)': a.masteredSets,
      'Coverage %': a.coverage,
      'Accuracy %': a.accuracy,
      'Readiness %': a.readiness,
      'Weak Eligible': (a.attemptedSets >= 3 || a.coverage >= 10) ? 'Yes' : 'No'
    })));
  }

  // Helper for CompletionTracking
  async function createCompletion(orgId: string, ayId: string, gradeId: string, sectionId: string | null, subjectId: string, unitId: string | null, topicId: string | null, subtopicId: string | null, level: any) {
    const existing = await prisma.completionTracking.findFirst({
      where: {
        organization_id: orgId,
        academic_year_id: ayId,
        grade_id: gradeId,
        section_id: sectionId,
        subject_id: subjectId,
        unit_id: unitId,
        topic_id: topicId,
        sub_topic_id: subtopicId,
        completion_level: level
      }
    });

    if (!existing) {
      await prisma.completionTracking.create({
        data: {
          organization_id: orgId,
          academic_year_id: ayId,
          grade_id: gradeId,
          section_id: sectionId,
          subject_id: subjectId,
          unit_id: unitId,
          topic_id: topicId,
          sub_topic_id: subtopicId,
          completion_level: level,
          is_completed: true,
          completed_at: new Date()
        }
      });
    }
  }

  console.log('\n✅ Final Seed and Validation Completed.');
}

run().catch(console.error).finally(() => process.exit(0));
