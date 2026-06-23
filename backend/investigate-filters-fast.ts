import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- ROOT CAUSE INVESTIGATION ---\n');

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
    console.log('No student enrollments found with subjects.');
    return;
  }

  const e = enrollment;

  console.log('Student:');
  console.log('- student_id:', e.student_id);
  console.log('- grade_id:', e.grade_id);
  console.log('- section_id:', e.section_id);
  console.log('- academic_year_id:', e.academic_year_id);
  console.log('');

  const total = await prisma.subject.count();
  console.log('Total subjects in database:', total);

  const activeTrue = await prisma.subject.count({ where: { is_active: true } });
  console.log('Subjects with is_active=true:', activeTrue);

  const activeFalse = await prisma.subject.count({ where: { is_active: false } });
  console.log('Subjects with is_active=false:', activeFalse);
  console.log('');

  console.log('--- INCREMENTAL FILTER TEST ---\n');

  const s1 = await prisma.subject.count();
  console.log('Step 1 (No filters):', s1);

  const s2 = await prisma.subject.count({ where: { grade_id: e.grade_id } });
  console.log('Step 2 (grade_id=' + e.grade_id + '):', s2);

  console.log('Step 3 (section_id): Subjects do not have section_id in schema.');

  console.log('Step 4 (academic_year_id): Subjects do not have academic_year_id in schema.');

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
    console.log('ROOT CAUSE FOUND:\nThe is_active: true condition is filtering out all subjects because their is_active value is false or null.');
  } else if (s2 === 0) {
    console.log('ROOT CAUSE FOUND:\nThe grade_id filter is causing 0 subjects because no subjects match this grade.');
  } else {
    console.log('ROOT CAUSE FOUND:\nSubjects ARE returned here. The issue is NOT in the subject query itself. It must be failing during enrollment matching, or the frontend is passing a different parameter that causes it to fail, OR the code throws an error downstream. Wait, did you check if getSubjectAnalytics returns an empty array? Yes, if enrollments is empty.');
  }

}

run().catch(console.error).finally(() => prisma.$disconnect());
