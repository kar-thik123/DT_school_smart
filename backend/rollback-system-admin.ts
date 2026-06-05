import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const superAdminRoles = await prisma.role.findMany({ where: { name: 'SUPER_ADMIN' } });
  const systemAdminPerm = await prisma.permission.findUnique({
    where: { module_action: { module: 'IDENTITY', action: 'IS_SYSTEM_ADMIN' } }
  });

  if (!systemAdminPerm) {
      console.log('IDENTITY:IS_SYSTEM_ADMIN permission not found in DB!');
      return;
  }

  let deletedCount = 0;
  for (const role of superAdminRoles) {
    const result = await prisma.rolePermission.deleteMany({
      where: {
        role_id: role.id,
        permission_id: systemAdminPerm.id
      }
    });
    deletedCount += result.count;
  }

  console.log(`Successfully removed IS_SYSTEM_ADMIN from all SUPER_ADMIN roles. Deleted ${deletedCount} role_permission records.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
