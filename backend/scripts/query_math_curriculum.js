const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurriculum() {
  const subject = await prisma.subject.findFirst({
    where: {
      name: 'Mathematics',
      grade: { name: '6' }
    },
    include: {
      units: {
        include: {
          topics: {
            include: {
              sub_topics: true
            }
          }
        }
      }
    }
  });

  if (!subject) {
    console.log("Mathematics subject for Grade 6 not found.");
    return;
  }

  console.log(`Subject: ${subject.name}`);
  subject.units.forEach(u => {
    console.log(`  Unit: ${u.name}`);
    u.topics.forEach(t => {
      console.log(`    Topic: ${t.name}`);
      t.sub_topics.forEach(s => {
        console.log(`      SubTopic: ${s.name}`);
      });
    });
  });
}

checkCurriculum()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
