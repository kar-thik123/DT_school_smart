const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurriculumDeletions() {
  const logs = await prisma.auditLog.findMany({
    where: {
      action_type: 'DELETE',
      entity_type: {
        in: ['TOPIC', 'SUB_TOPIC', 'UNIT', 'SUBJECT']
      }
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 20
  });

  console.log(`Found ${logs.length} curriculum deletion logs.`);
  logs.forEach(l => {
    console.log(`[${l.timestamp}] Deleted ${l.entity_type} by ${l.user_name} | Metadata: ${JSON.stringify(l.metadata)}`);
  });
}

checkCurriculumDeletions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
