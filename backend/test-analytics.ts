import { StudentReadinessService } from './src/services/student-readiness.service';
import prisma from './src/prisma';

async function run() {
  const enrollments = await prisma.studentEnrollment.findMany({ take: 1 });
  if (!enrollments.length) return;
  const e = enrollments[0];
  
  try {
    const res = await StudentReadinessService.getSubjectAnalytics(e.student_id, e.organization_id, e.academic_year_id);
    console.log('Result length:', res.length);
    console.log(res);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

run().finally(() => prisma.$disconnect());
