import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  const yearId = '182480cb-b0f9-4eb8-af1d-dc19cea211a4';

  const allAttempts = await prisma.practiceAttempt.findMany({
    where: { organization_id: orgId, academic_year_id: yearId }
  });

  let totalCorrect = 0;
  let totalQuestions = 0;
  allAttempts.forEach(a => {
    totalCorrect += a.correct_answers;
    totalQuestions += a.total_questions;
  });

  const avgPreparedness = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  console.log('--- READINESS CHECK ---');
  console.log('Total Attempts:', allAttempts.length);
  console.log('Total Correct Answers:', totalCorrect);
  console.log('Total Questions Attempted:', totalQuestions);
  console.log('Overall Academic Readiness %:', avgPreparedness);
}

main().catch(console.error).finally(() => prisma.$disconnect());
