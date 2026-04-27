const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const grade = await prisma.grade.findFirst({
    include: {
      sections: true,
      subjects: {
        include: {
          units: {
            include: { topics: true }
          },
          subject_groups: {
            include: { group: true }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(grade, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
