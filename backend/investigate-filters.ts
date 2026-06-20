import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- ROOT CAUSE INVESTIGATION ---\n');

  // Find a student who has "History" or just any student
  const enrollments = await prisma.studentEnrollment.findMany({
    include: { student: true, grade: true }
  });

  if (enrollments.length === 0) {
    console.log('No student enrollments found.');
    return;
  }

  // Let's find one where grade has History, or just use the first one
  let e = enrollments[0];
  for (const enr of enrollments) {
    const subjects = await prisma.subject.findMany({ where: { grade_id: enr.grade_id }});
    if (subjects.some(s => s.name === 'History')) {
      e = enr;
      break;
    }
  }

  console.log('Student:');
  console.log('- student_id:', e.student_id);
  console.log('- grade_id:', e.grade_id);
  console.log('- section_id:', e.section_id);
  console.log('- academic_year_id:', e.academic_year_id);
  console.log('');

  // 1. Total subjects in database
  const total = await prisma.subject.count();
  console.log('Total subjects in database:', total);

  const activeTrue = await prisma.subject.count({ where: { is_active: true } });
  console.log('Subjects with is_active=true:', activeTrue);

  const activeFalse = await prisma.subject.count({ where: { is_active: false } });
  console.log('Subjects with is_active=false:', activeFalse);

  const rawSubjects: any[] = await prisma.$queryRaw`SELECT is_active, COUNT(*) as cnt FROM "Subject" GROUP BY is_active`;
  let activeNull = 0;
  for (const row of rawSubjects) {
      if (row.is_active === null) activeNull = Number(row.cnt);
  }
  console.log('Subjects with is_active=null:', activeNull);
  console.log('');

  console.log('--- INCREMENTAL FILTER TEST ---\n');

  // Step 1: No filters
  const s1 = await prisma.subject.count();
  console.log('Step 1 (No filters):', s1);

  // Step 2: Add grade filter
  const s2 = await prisma.subject.count({ where: { grade_id: e.grade_id } });
  console.log('Step 2 (grade_id=' + e.grade_id + '):', s2);

  // Step 3: Add section filter
  // Subjects don't have section_id, but the user says "Add section filter". 
  // Is it possible that the code somehow added section_id?
  // Let's see if Subject schema has section_id. I checked earlier, it didn't.
  // Wait, maybe the user means on completion_tracking? No, the user says "Show subject count after each step."
  // Maybe the frontend sends academic_year_id and the subject is filtered? Subject has no academic_year_id.
  // Oh wait, did my earlier modification add filters that shouldn't be there?
  // Let's just do what they asked.

  console.log('Step 3 (section_id): Subjects do not have section_id in schema.');

  console.log('Step 4 (academic_year_id): Subjects do not have academic_year_id in schema.');

  // Step 5: Add is_active filter
  const s5 = await prisma.subject.count({ where: { grade_id: e.grade_id, is_active: true } });
  console.log('Step 5 (is_active=true):', s5);

  console.log('\nSubjects Returned (Step 5):');
  const subjects = await prisma.subject.findMany({
    where: { grade_id: e.grade_id, is_active: true },
    select: { id: true, name: true, is_active: true, grade_id: true }
  });
  console.table(subjects);

  console.log('\n--- ROOT CAUSE FOUND ---');
  if (s5 === 0 && s2 > 0) {
    console.log('The is_active: true condition is filtering out all subjects because their is_active value is false or null.');
  } else if (s2 === 0) {
    console.log('The grade_id filter is causing 0 subjects because no subjects match this grade.');
  } else {
    // If we have subjects here, let's see why SubjectAnalytics might have failed.
    console.log('Wait, subjects ARE returned here. Let us check the enrollments query in getSubjectAnalytics.');
    const enrollmentsCheck = await prisma.studentEnrollment.findMany({
      where: { student_id: e.student_id, academic_year_id: e.academic_year_id }, // maybe organization_id is mismatched?
    });
    console.log('Enrollments for student + academic_year:', enrollmentsCheck.length);
  }

}

run().catch(console.error).finally(() => prisma.$disconnect());
