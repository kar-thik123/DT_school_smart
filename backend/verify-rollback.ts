import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- VERIFICATION ---');

  // 1. Get the specific SUPER_ADMIN role (we'll just pick the first one created to represent the state, as all 16 have identical permissions)
  const superAdmins = await prisma.role.findMany({ where: { name: 'SUPER_ADMIN' }, include: { permissions: { include: { permission: true } } } });
  
  if (superAdmins.length === 0) {
    console.log('No SUPER_ADMIN roles found.');
    return;
  }

  const sampleSuperAdmin = superAdmins[0];
  console.log(`\n1. Permissions currently assigned to SUPER_ADMIN (Role ID: ${sampleSuperAdmin.id}):`);
  const perms = sampleSuperAdmin.permissions.map(rp => `${rp.permission.module}:${rp.permission.action}`);
  console.log(perms);

  // 2. Confirm IDENTITY:IS_SYSTEM_ADMIN exists
  const hasSystemAdmin = perms.includes('IDENTITY:IS_SYSTEM_ADMIN');
  console.log(`\n2. IDENTITY:IS_SYSTEM_ADMIN exists in SUPER_ADMIN permissions: ${hasSystemAdmin}`);

  // 3. Confirm target database records to be removed
  const systemAdminPerm = await prisma.permission.findUnique({
    where: { module_action: { module: 'IDENTITY', action: 'IS_SYSTEM_ADMIN' } }
  });

  if (!systemAdminPerm) {
    console.log('IDENTITY:IS_SYSTEM_ADMIN permission not found in DB!');
    return;
  }

  console.log(`\nPermission ID for IDENTITY:IS_SYSTEM_ADMIN: ${systemAdminPerm.id}`);

  const recordsToRemove = await prisma.rolePermission.findMany({
    where: {
      role_id: { in: superAdmins.map(r => r.id) },
      permission_id: systemAdminPerm.id
    },
    include: { role: true }
  });

  console.log(`\nExact database records (RolePermission) that will be removed:`);
  console.table(recordsToRemove.map(r => ({
    rolePermissionId: `${r.role_id}_${r.permission_id}`,
    roleId: r.role_id,
    roleName: r.role.name,
    permissionId: r.permission_id
  })));

  // 4 & 5. Verify SYSTEM_ADMIN and others remain untouched
  const systemAdmins = await prisma.role.findMany({ where: { name: 'SYSTEM_ADMIN' }, include: { permissions: true } });
  const sysAdminWithPerm = systemAdmins.filter(r => r.permissions.some(p => p.permission_id === systemAdminPerm.id));
  
  console.log(`\nSYSTEM_ADMIN roles currently holding IDENTITY:IS_SYSTEM_ADMIN: ${sysAdminWithPerm.length} out of ${systemAdmins.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
