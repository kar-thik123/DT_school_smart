import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- KMSS ROLES AND PERMISSIONS DIAGNOSTIC ---');
  
  const org = await prisma.organization.findFirst({ where: { subdomain: 'KMSS' } });
  if (!org) {
    console.log('KMSS Organization not found!');
    return;
  }
  
  const roles = await prisma.role.findMany({
    where: { organization_id: org.id },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });
  
  for (const role of roles) {
    console.log(`\nRole: ${role.name} (${role.id})`);
    console.log('Permissions count:', role.permissions.length);
    console.log('Permissions:', role.permissions.map(rp => `${rp.permission.module}:${rp.permission.action}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
