import { PrismaClient } from '@prisma/client';
import { StudentReadinessService } from './src/services/student-readiness.service';

const prisma = new PrismaClient();

async function run() {
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: {
      grade: {
        subjects: {
          some: {}
        }
      }
    }
  });

  if (!enrollment) {
    console.log('No student enrollments found.');
    return;
  }

  const e = enrollment;

  const totalBeforeFilter = await prisma.subject.count({
    where: { grade_id: e.grade_id, organization_id: e.organization_id }
  });

  const totalAfterFilter = await prisma.subject.count({
    where: { 
      grade_id: e.grade_id, 
      organization_id: e.organization_id,
      OR: [
        { is_active: true },
        { is_active: { not: false } }
      ]
    }
  });

  console.log('Subject Count Before Filter:', totalBeforeFilter);
  console.log('Subject Count After Filter:', totalAfterFilter);

  const analytics = await StudentReadinessService.getSubjectAnalytics(e.student_id, e.organization_id, e.academic_year_id);
  console.log('Subject Analytics returned', analytics.length, 'subjects for the current student.');
}

run().finally(() => prisma.$disconnect());
