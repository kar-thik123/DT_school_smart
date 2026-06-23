import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
  console.log('--- ANALYTICS READINESS VERIFICATION ---');

  // 1. Data Accuracy & Integrity
  const totalResults = await prisma.studentExamResult.count();
  const nullResults = await prisma.studentExamResult.count({
    where: {
      OR: [
        { percentage: null },
        { total_obtained_marks: null },
        { total_max_marks: null }
      ]
    }
  });

  console.log(`1. Historical Data Integrity:`);
  console.log(`Total StudentExamResults: ${totalResults}`);
  console.log(`Total with NULL aggregates: ${nullResults}`);
  
  if (nullResults > 0) {
      console.log('⚠️ FAILURE: NULL records still exist.');
  } else {
      console.log('✅ PASS: All records contain full aggregates.');
  }

  // 2. Data Volume
  const totalExaminations = await prisma.examination.count();
  const totalSubjectResults = await prisma.studentExamSubjectResult.count();
  
  console.log(`\n2. Data Volume Validation:`);
  console.log(`Total Examinations: ${totalExaminations}`);
  console.log(`Total StudentExamResults: ${totalResults}`);
  console.log(`Total StudentExamSubjectResults: ${totalSubjectResults}`);

  // 3. Examination History Readiness
  const examinations = await prisma.examination.findMany({
      take: 10
  });

  console.log(`\n3. Examination Classification:`);
  for (const exam of examinations) {
      console.log(`- ${exam.exam_name} (Type: ${exam.exam_type})`);
  }

  const distinctTypes = await prisma.examination.findMany({
      select: { exam_type: true },
      distinct: ['exam_type']
  });
  console.log(`Distinct Exam Types configured: ${distinctTypes.map(d => d.exam_type).join(', ')}`);

}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
