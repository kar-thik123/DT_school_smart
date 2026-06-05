import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const superAdminRoles = await prisma.role.findMany({ where: { name: 'SUPER_ADMIN' } });
  
  if (superAdminRoles.length === 0) {
    console.log('No SUPER_ADMIN roles found.');
    return;
  }

  const allDbPermissions = await prisma.permission.findMany();
  
  let totalMapped = 0;
  
  for (const role of superAdminRoles) {
    // Clean existing mappings
    await prisma.rolePermission.deleteMany({ where: { role_id: role.id } });
    
    // Assign ALL permissions
    await prisma.rolePermission.createMany({
      data: allDbPermissions.map(p => ({
        role_id: role.id,
        permission_id: p.id
      }))
    });
    totalMapped++;
  }

  console.log(`Successfully mapped all ${allDbPermissions.length} permissions to ${totalMapped} SUPER_ADMIN roles.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
