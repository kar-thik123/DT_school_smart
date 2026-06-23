import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- PHASE 2: DATABASE INTEGRITY AUDIT ---');
  
  const examsCount = await prisma.examination.count();
  const resultsCount = await prisma.studentExamResult.count();
  const subjectResultsCount = await prisma.studentExamSubjectResult.count();
  
  console.log(`Examinations: ${examsCount}`);
  console.log(`StudentExamResults: ${resultsCount}`);
  console.log(`StudentExamSubjectResults: ${subjectResultsCount}`);

  // Orphan Check
  const orphanResults = await prisma.studentExamResult.count({
    where: { examination: { is: null } }
  });
  console.log(`Orphan Results (no exam): ${orphanResults}`);

  const orphanSubjects = await prisma.studentExamSubjectResult.count({
    where: { student_exam_result: { is: null } }
  });
  console.log(`Orphan Subject Results (no parent): ${orphanSubjects}`);

  // Missing Data Check
  const missingPercentages = await prisma.studentExamResult.count({
    where: { percentage: null }
  });
  const missingStatus = await prisma.studentExamResult.count({
    where: { result_status: null }
  });
  console.log(`Missing Percentages: ${missingPercentages}`);
  console.log(`Missing Result Status: ${missingStatus}`);

  // Duplicate Records Check
  const dupes = await prisma.$queryRaw`
    SELECT examination_id, student_id, COUNT(*) as cnt
    FROM student_exam_results
    GROUP BY examination_id, student_id
    HAVING COUNT(*) > 1
  `;
  console.log(`Duplicate Exam Results (same exam + student): ${(dupes as any[]).length}`);

  console.log('\n--- PHASE 7: CALCULATION AUDIT ---');
  
  // Fetch some samples to verify calculation logic manually
  const samples = await prisma.studentExamResult.findMany({
    where: { total_obtained_marks: { not: null }, total_max_marks: { not: null, gt: 0 } },
    take: 5,
    include: { subject_results: true }
  });

  if (samples.length > 0) {
    for (const s of samples) {
      const calcPercentage = (s.total_obtained_marks! / s.total_max_marks!) * 100;
      let subjectTotalObtained = 0;
      let subjectTotalMax = 0;
      s.subject_results.forEach(sub => {
        subjectTotalObtained += sub.obtained_marks;
        subjectTotalMax += sub.max_marks;
      });

      console.log(`\nResult ID: ${s.id}`);
      console.log(`Stored Total: ${s.total_obtained_marks} / ${s.total_max_marks} | Calc Subject Sums: ${subjectTotalObtained} / ${subjectTotalMax}`);
      console.log(`Stored %: ${s.percentage} | Calc %: ${calcPercentage}`);
      console.log(`Status: ${s.result_status} | Grade: ${s.grade}`);
    }
  } else {
    console.log('No valid sample records found for calculation verification.');
  }

  console.log('\n--- PHASE 11: PERFORMANCE AUDIT (Indexes) ---');
  // We can query pg_indexes if it's postgres, but prisma schema is enough.
  console.log('Done.');
}

run().catch(console.error).finally(() => prisma.$disconnect());
