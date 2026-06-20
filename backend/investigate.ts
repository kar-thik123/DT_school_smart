import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- STARTING INVESTIGATION ---');

  const total = await prisma.subject.count();
  const activeTrue = await prisma.subject.count({ where: { is_active: true } });
  const activeFalse = await prisma.subject.count({ where: { is_active: false } });
  
  console.log('Total Subjects:', total);
  console.log('Subjects with is_active=true:', activeTrue);
  console.log('Subjects with is_active=false:', activeFalse);
  
  const enrollments = await prisma.studentEnrollment.findMany({ take: 1 });
  if (!enrollments.length) {
    console.log('No enrollments found!');
    return;
  }
  const e = enrollments[0];
  console.log('\n--- STUDENT INFO ---');
  console.log('student_id:', e.student_id);
  console.log('grade_id:', e.grade_id);
  console.log('section_id:', e.section_id);
  console.log('academic_year_id:', e.academic_year_id);
  console.log('organization_id:', e.organization_id);

  const s1 = await prisma.subject.count();
  console.log('\nStep 1 (No filters):', s1);

  const s2 = await prisma.subject.count({ where: { grade_id: e.grade_id } });
  console.log('Step 2 (+grade_id):', s2);

  const s3 = await prisma.subject.count({ where: { grade_id: e.grade_id, organization_id: e.organization_id } });
  console.log('Step 3 (+organization_id):', s3);

  const s4 = await prisma.subject.count({ where: { grade_id: e.grade_id, organization_id: e.organization_id, is_active: true } });
  console.log('Step 4 (+is_active=true):', s4);

  const subjects = await prisma.subject.findMany({
    where: { grade_id: e.grade_id, organization_id: e.organization_id },
    select: { id: true, name: true, is_active: true, grade_id: true }
  });
  console.log('\nSubjects returned for this grade without active filter:');
  console.table(subjects);

}

run().catch(console.error).finally(() => prisma.$disconnect());
