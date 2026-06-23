import { PrismaClient } from '@prisma/client';
import { StudentReadinessService } from './services/student-readiness.service';

const prisma = new PrismaClient();

async function runAudit() {
  const gokuls = await prisma.user.findMany({where:{name:'Gokul Sharma'}, include:{enrollments:true}});
  const gokul = gokuls.find((u:any) => u.enrollments.length > 0);
  const haris = await prisma.user.findMany({where:{name:'Hari Reddy'}, include:{enrollments:true}});
  const hari = haris.find((u:any) => u.enrollments.length > 0);

  async function printUser(name: string, user: any) {
    console.log(`\n================================`);
    console.log(`Validation - ${name}`);
    console.log(`================================\n`);
    
    if (!user || user.enrollments.length === 0) {
      console.log('No user or enrollments found.');
      return;
    }
    
    const userId = user.id;
    const orgId = user.enrollments[0].organization_id;
    const academicYearId = user.enrollments[0].academic_year_id;

    const kpis = await StudentReadinessService.getKPIs(userId, orgId, academicYearId);
    const subjects = await StudentReadinessService.getSubjectAnalytics(userId, orgId, academicYearId);
    const attendance = await StudentReadinessService.getAttendance(userId, orgId, academicYearId);
    const continueLearning = await StudentReadinessService.getContinueLearning(userId, orgId, academicYearId);
    const trend = await StudentReadinessService.getWeeklyTrend(userId, orgId, academicYearId);

    console.log("--- APIs Output ---");
    console.log("Attendance:", JSON.stringify(attendance, null, 2));
    console.log("KPIs:", JSON.stringify(kpis, null, 2));
    console.log("Continue Learning:", JSON.stringify(continueLearning, null, 2));

    console.log("\n--- Weak Subject Verification ---");
    subjects.forEach((s: any) => {
      console.log(`Subject: ${s.subjectName} | Coverage: ${s.coverage}% | Accuracy: ${s.accuracy}% | Readiness: ${s.readiness}% | Attempts: ${s.attemptedSets} | Eligible: ${s.attemptedSets >= 3 || s.coverage >= 10 ? 'Yes' : 'No'}`);
    });

    console.log("\n--- Weekly Trend Verification ---");
    console.log(`Weeks Returned: ${trend.length}`);
    console.log(JSON.stringify(trend.map((t: any) => ({
      week: t.week,
      coverage: t.coverage,
      accuracy: t.accuracy,
      readiness: t.readiness
    })), null, 2));

    console.log("\n--- Continue Learning Verification ---");
    if (continueLearning) {
      console.log(`Selected Node: ${continueLearning.title || continueLearning.subject}`);
      console.log(`Priority: ${continueLearning.priority}`);
      console.log(`Action URL: ${continueLearning.actionUrl}`);
      console.log(`Reason: ${continueLearning.reason}`);
    } else {
      console.log("No continue learning data.");
    }
  }

  await printUser('Gokul Sharma', gokul);
  await printUser('Hari Reddy', hari);

  await prisma.$disconnect();
}

runAudit().catch(console.error);
