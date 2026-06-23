import { PrismaClient } from '@prisma/client';
import { StudentReadinessService } from './services/student-readiness.service';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: { name: { in: ['Gokul Sharma', 'Hari Reddy'] } },
    include: { enrollments: true }
  });

  // Pick one Gokul and one Hari that have enrollments
  const selectedUsers = [];
  const names = new Set();
  
  for (const u of users) {
    if (u.enrollments.length > 0 && !names.has(u.name)) {
      selectedUsers.push(u);
      names.add(u.name);
    }
  }

  for (const user of selectedUsers) {
    console.log(`\n=== Validation for ${user.name} (Org: ${user.organization_id}) ===`);
    const academicYearId = user.enrollments[0].academic_year_id;

    const attendance = await StudentReadinessService.getAttendance(user.id, user.organization_id, academicYearId);
    console.log(`Attendance: ${attendance.attendancePercentage}%`);

    const kpis = await StudentReadinessService.getKPIs(user.id, user.organization_id, academicYearId);
    console.log(`Coverage: ${kpis.curriculumCoverage}%`);
    
    const subjects = await StudentReadinessService.getSubjectAnalytics(user.id, user.organization_id, academicYearId);
    const avgAccuracy = subjects.length > 0 ? subjects.reduce((sum, s) => sum + s.accuracy, 0) / subjects.length : 0;
    console.log(`Accuracy: ${avgAccuracy.toFixed(1)}%`);

    console.log(`Readiness: ${kpis.readyForExam}%`);
    console.log(`Weak Subject: ${kpis.weakSubject}`);

    const continueLearning = await StudentReadinessService.getContinueLearning(user.id, user.organization_id, academicYearId);
    console.log(`Continue Learning:`, continueLearning);
  }
}

run().catch(console.error).finally(() => process.exit(0));
