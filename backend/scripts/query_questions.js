const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQuestions() {
  const grade = await prisma.grade.findFirst({ where: { name: '6' } });
  if (!grade) {
    console.log("Grade 6 not found");
    return;
  }
  
  const questions = await prisma.question.findMany({
    where: {
      grade_id: grade.id
    },
    include: {
      grade: true,
      section: true,
      subject: true,
      topic: true,
      sub_topic: true,
      unit: true
    }
  });

  console.log(`Total Grade 6 questions found: ${questions.length}`);
  questions.forEach(q => {
    console.log(`Q: ${q.question_text}`);
    console.log(`  Grade: ${q.grade?.name} (${q.grade_id})`);
    console.log(`  Section: ${q.section?.name} (${q.section_id})`);
    console.log(`  Subject: ${q.subject?.name} (${q.subject_id})`);
    console.log(`  Unit: ${q.unit?.name} (${q.unit_id})`);
    console.log(`  Topic: ${q.topic?.name} (${q.topic_id})`);
    console.log(`  SubTopic: ${q.sub_topic?.name} (${q.sub_topic_id})`);
  });
}

checkQuestions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
