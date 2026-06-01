const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dumpQuestions() {
  const questions = await prisma.question.findMany({
    include: {
      grade: true,
      section: true,
      subject: true,
      unit: true,
      topic: true,
      sub_topic: true,
      creator: true
    }
  });

  console.log(`Total questions in DB: ${questions.length}`);
  questions.forEach(q => {
    console.log(`[${q.created_at.toISOString()}] Q: ${q.question_text}`);
    console.log(`  Grade: ${q.grade?.name} Section: ${q.section?.name} Subject: ${q.subject?.name}`);
    console.log(`  Unit: ${q.unit?.name} Topic: ${q.topic?.name} SubTopic: ${q.sub_topic?.name}`);
  });
}

dumpQuestions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
