import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  
  // Get all roles
  const roles = await prisma.role.findMany({
    where: { organization_id: orgId },
    include: {
      _count: { select: { users: true } },
      permissions: { include: { permission: true } }
    }
  });

  console.log('--- ROLES ---');
  roles.forEach(r => {
    console.log(`Role: ${r.name} (ID: ${r.id})`);
    console.log(`  User Count: ${r._count.users}`);
    console.log(`  Permissions actions:`, r.permissions.map(p => `${p.permission.module}:${p.permission.action}`));
  });

  // Count active users by role name
  const users = await prisma.user.findMany({
    where: { organization_id: orgId },
    include: { role: true }
  });

  console.log('\n--- USERS BY ROLE NAME ---');
  const counts: Record<string, number> = {};
  users.forEach(u => {
    const rname = u.role?.name || 'No Role';
    counts[rname] = (counts[rname] || 0) + 1;
  });
  console.log(counts);

  // Check attendance calculations
  // How is attendance recorded? Let's check a few records of StudentAttendance.
  const attendance = await prisma.studentAttendance.findMany({
    where: { organization_id: orgId },
    take: 5
  });
  console.log('\n--- STUDENT ATTENDANCE EXAMPLES ---');
  console.log(attendance);

  // Let's aggregate attendance: how is the average attendance % calculated in this system?
  // Let's see if there is an existing service or calculation.
}

main().catch(console.error).finally(() => prisma.$disconnect());
