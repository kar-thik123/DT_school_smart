import { PrismaClient, Prisma } from '@prisma/client';
import { getActiveAcademicYearId } from './src/utils/academic-helper';
import { StudentReadinessService } from './src/services/student-readiness.service';

const prisma = new PrismaClient();

async function run() {
  console.log('--- END-TO-END DASHBOARD DEBUGGING AUDIT ---');
  
  const user = await prisma.user.findFirst({
    where: { enrollments: { some: {} } },
    include: { enrollments: true }
  });

  if (!user) {
    console.log('No user with enrollments found.');
    return;
  }

  const student_id = user.id;
  const organization_id = user.organization_id;
  
  console.log('\n1. Student Context:');
  console.log('Student ID:', student_id);
  console.log('Organization ID:', organization_id);
  
  const activeAcademicYearId = await getActiveAcademicYearId(organization_id);
  console.log('Active Academic Year ID:', activeAcademicYearId);

  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { student_id, organization_id, academic_year_id: activeAcademicYearId }
  });
  console.log('Enrollment:', enrollment);

  console.log('\n--- API Route Emulation ---');
  
  console.log('\n[A] /subjects (getSubjectAnalytics)');
  try {
    const subjects = await StudentReadinessService.getSubjectAnalytics(student_id, organization_id, activeAcademicYearId);
    console.log('Subjects returned length:', subjects.length);
  } catch (e: any) {
    console.log('FAIL [A] Subjects:', e.message);
  }

  console.log('\n[B] /curriculum-progress (Learning Journey)');
  try {
    if (!enrollment) throw new Error('No enrollment');
    const sectionCondition = enrollment.section_id 
      ? Prisma.sql`AND (ct.section_id = ${enrollment.section_id}::uuid OR ct.section_id IS NULL)`
      : Prisma.sql`AND ct.section_id IS NULL`;

    const rawResults = await prisma.$queryRaw`
      SELECT s.id as subject_id, s.name as subject_name
      FROM subjects s
      WHERE s.grade_id = ${enrollment.grade_id}::uuid 
        AND s.organization_id = ${organization_id}::uuid
      ORDER BY s.sort_order ASC, s.name ASC
    `;
    console.log('Curriculum Progress subjects length:', (rawResults as any).length);
  } catch (e: any) {
    console.log('FAIL [B] Curriculum:', e.message);
  }

  console.log('\n[C] /attendance');
  try {
    const attendance = await StudentReadinessService.getAttendance(student_id, organization_id, activeAcademicYearId);
    console.log('Attendance:', attendance);
  } catch (e: any) {
    console.log('FAIL [C] Attendance:', e.message);
  }

  console.log('\n[D] /activities');
  try {
    const practices = await prisma.practiceAttempt.findMany({
      where: { student_id, organization_id, academic_year_id: activeAcademicYearId },
      take: 1
    });
    console.log('Activities (practices found):', practices.length);
  } catch (e: any) {
    console.log('FAIL [D] Activities:', e.message);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
