const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurriculum() {
  const topics = await prisma.topic.findMany({
    where: {
      name: { contains: 'Sum', mode: 'insensitive' }
    },
    include: {
      unit: { include: { subject: { include: { grade: true } } } }
    }
  });

  console.log(`Topics containing 'Sum':`, topics.length);
  topics.forEach(t => {
    console.log(`- Topic: ${t.name} (Unit: ${t.unit?.name}, Subject: ${t.unit?.subject?.name}, Grade: ${t.unit?.subject?.grade?.name})`);
  });

  const subtopics = await prisma.subTopic.findMany({
    where: {
      name: { contains: 'Addition', mode: 'insensitive' }
    },
    include: {
      topic: { include: { unit: { include: { subject: { include: { grade: true } } } } } }
    }
  });

  console.log(`Subtopics containing 'Addition':`, subtopics.length);
  subtopics.forEach(s => {
    console.log(`- Subtopic: ${s.name} (Topic: ${s.topic?.name}, Unit: ${s.topic?.unit?.name})`);
  });
}

checkCurriculum()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
