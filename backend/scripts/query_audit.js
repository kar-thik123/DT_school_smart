const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuditLogs() {
  const logs = await prisma.auditLog.findMany({
    where: {
      entity_type: 'QUESTION'
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 100
  });

  console.log(`Found ${logs.length} question logs.`);
  logs.forEach(l => {
    console.log(`[${l.timestamp}] ${l.action_type} by ${l.user_name} | Metadata: ${JSON.stringify(l.metadata)}`);
  });
}

checkAuditLogs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
