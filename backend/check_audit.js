const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ include: { role: true } });
  let violations = 0;
  for (const u of users) {
    if (u.role && u.role.organization_id !== u.organization_id) {
      if (!(u.role.is_system && u.role.organization_id === null)) {
        console.log('Violation found:', u.email, 'User Org:', u.organization_id, 'Role Org:', u.role.organization_id);
        violations++;
      }
    }
  }
  console.log('Total violations:', violations);
}
run();
