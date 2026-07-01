import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org_id = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  
  const logs = await prisma.auditLog.findMany({
    where: { organization_id: org_id },
    orderBy: { timestamp: 'desc' },
    take: 10
  });

  console.log(`--- AUDIT LOGS FOUND: ${logs.length} ---`);
  logs.forEach(l => {
    console.log(`- User: ${l.user_name}, Action: ${l.action_type}, Entity: ${l.entity_type}, TS: ${l.timestamp}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
