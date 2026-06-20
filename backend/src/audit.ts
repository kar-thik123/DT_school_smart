import { PrismaClient } from '@prisma/client';
import { StudentReadinessService } from './services/student-readiness.service';

const prisma = new PrismaClient();

async function getStudent(name: string) {
  const users = await prisma.user.findMany({
    where: { name },
    include: { enrollments: true }
  });
  return users.find(u => u.enrollments.length > 0);
}

async function run() {
  const gokul = await getStudent('Gokul Sharma');
  const hari = await getStudent('Hari Reddy');

  const students = [{ name: 'Gokul Sharma', user: gokul }, { name: 'Hari Reddy', user: hari }];

  for (const { name, user } of students) {
    console.log(`\n===========================================`);
    console.log(`Validation for ${name}`);
    console.log(`===========================================`);
    if (!user) {
      console.log(`User not found with enrollment.`);
      continue;
    }
    const orgId = user.organization_id;
    const academicYearId = user.enrollments[0].academic_year_id;

    const attendance = await StudentReadinessService.getAttendance(user.id, orgId, academicYearId);
    console.log(`Attendance %: ${attendance.attendancePercentage}`);

    const kpis = await StudentReadinessService.getKPIs(user.id, orgId, academicYearId);
    console.log(`Coverage %: ${kpis.curriculumCoverage}`);
    
    const subjects = await StudentReadinessService.getSubjectAnalytics(user.id, orgId, academicYearId);
    const avgAccuracy = subjects.length > 0 ? subjects.reduce((sum: any, s: any) => sum + s.accuracy, 0) / subjects.length : 0;
    console.log(`Accuracy %: ${avgAccuracy.toFixed(1)}`);
    console.log(`Readiness %: ${kpis.readyForExam}`);
    console.log(`Weak Subject: ${kpis.weakSubject}`);

    const continueLearning = await StudentReadinessService.getContinueLearning(user.id, orgId, academicYearId);
    console.log(`Continue Learning: \n`, JSON.stringify(continueLearning, null, 2));

    // For validations 3 & 4: Output details for Mathematics (or any subject)
    const math = subjects.find((s: any) => s.subjectName.toLowerCase().includes('math') || s.subjectName.toLowerCase().includes('tamil')) || subjects[0];
    if (math) {
      console.log(`\n--- Validation 3 – Coverage Calculation Audit (${math.subjectName}) ---`);
      console.log(`Assessment Enabled Units: ? (handled dynamically inside service)`);
      console.log(`Assessment Enabled Topics: ?`);
      console.log(`Assessment Enabled Subtopics: ?`);
      console.log(`Completed Units: ${math.unitCompleted}`);
      console.log(`Completed Topics: ${math.topicCompleted}`);
      console.log(`Completed Subtopics: ${math.subtopicCompleted}`);
      console.log(`Coverage: ${math.coverage}`);
    }

    // Weak Subject
    console.log(`\n--- Validation 5 – Weak Subject Audit ---`);
    for (const sub of subjects) {
      console.log(`Subject: ${sub.subjectName} | Coverage: ${sub.coverage} | Accuracy: ${sub.accuracy} | Readiness: ${sub.readiness} | Attempts: ${(sub as any)._attemptedSets}`);
    }

    // Attendance details
    console.log(`\n--- Validation 7 – Attendance Audit ---`);
    console.log(`Present: ${attendance.present}`);
    console.log(`Absent: ${attendance.absent}`);
    console.log(`Late: ${attendance.late}`);
    console.log(`Excused: ${attendance.excused}`);
    const total = attendance.present + attendance.late + attendance.absent + attendance.excused;
    console.log(`Calculation: (${attendance.present} + ${attendance.late}) / (${total} - ${attendance.excused}) * 100 = ${attendance.attendancePercentage}`);

    // Weekly trend
    console.log(`\n--- Validation 8 – Weekly Trend Audit ---`);
    const trend = await StudentReadinessService.getWeeklyTrend(user.id, orgId, academicYearId);
    console.log(`Weekly Trend (Sample 3):`, JSON.stringify(trend.slice(0, 3), null, 2));
  }
}

run().catch(console.error).finally(() => process.exit(0));
