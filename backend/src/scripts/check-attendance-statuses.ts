import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  
  const distinctStatuses = await prisma.studentAttendance.groupBy({
    by: ['status'],
    where: { organization_id: orgId }
  });

  console.log('Distinct Attendance Statuses in DB:', distinctStatuses.map(s => s.status));

  // Let's also check total count of PRESENT, ABSENT, etc.
  for (const s of distinctStatuses) {
    const count = await prisma.studentAttendance.count({
      where: { organization_id: orgId, status: s.status }
    });
    console.log(`Status: ${s.status}, Count: ${count}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
