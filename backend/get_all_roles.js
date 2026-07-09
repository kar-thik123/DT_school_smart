const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });
  roles.forEach(r => {
    console.log(`Role ID: ${r.id}, Name: ${r.name}, Organization ID: ${r.organization_id}, Permissions Count: ${r.permissions.length}`);
    if (r.name === 'SYSTEM_ADMIN') {
      console.log('System Admin permissions:', r.permissions.map(rp => `${rp.permission.module}:${rp.permission.action}`));
    }
  });
}
run().catch(console.error).finally(() => prisma.$disconnect());
