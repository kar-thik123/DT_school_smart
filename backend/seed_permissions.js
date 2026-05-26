const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.permission.upsert({
    where: { module_action: { module: 'COMPLETION', action: 'MANAGE' } },
    update: {},
    create: { module: 'COMPLETION', action: 'MANAGE', description: 'Manage completion tracking configuration' }
  });
  await prisma.permission.upsert({
    where: { module_action: { module: 'COMPLETION', action: 'VIEW' } },
    update: {},
    create: { module: 'COMPLETION', action: 'VIEW', description: 'View completion tracking data' }
  });
  console.log('Permissions seeded.');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
