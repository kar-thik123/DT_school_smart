import { PrismaClient } from '@prisma/client';
import { getFlatPermissions, PERMISSION_DOMAINS } from './src/config/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Permission Bootstrap ---');

  const permissions = getFlatPermissions();

  // 1. Sync Permissions Table
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: { description: p.description },
      create: { module: p.module, action: p.action, description: p.description }
    });
  }
  console.log(`Synced ${permissions.length} permissions.`);

  // 2. Identify System Roles
  // Note: System roles might be global (null org) or scoped. We find the relevant ones for bootstrap.
  const systemAdminRole = await prisma.role.findFirst({ where: { name: 'SYSTEM_ADMIN' } });
  const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
  const managementRole = await prisma.role.findFirst({ where: { name: 'MANAGEMENT' } });

  // 3. Map Default Permissions to SYSTEM_ADMIN (Absolute Control)
  if (systemAdminRole) {
    const allDbPermissions = await prisma.permission.findMany();
    await prisma.rolePermission.deleteMany({ where: { role_id: systemAdminRole.id } });
    await prisma.rolePermission.createMany({
      data: allDbPermissions.map(p => ({
        role_id: systemAdminRole.id,
        permission_id: p.id
      }))
    });
    console.log('Mapped all permissions to SYSTEM_ADMIN.');
  }

  // 4. Map Default Permissions to SUPER_ADMIN (Tenant Control)
  const superAdminRoles = await prisma.role.findMany({ where: { name: 'SUPER_ADMIN' } });
  if (superAdminRoles.length > 0) {
    const allDbPermissions = await prisma.permission.findMany();
    const tenantDbPermissions = allDbPermissions.filter(p =>
      PERMISSION_DOMAINS[p.module] === 'TENANT' &&
      !(p.module === 'IDENTITY' && p.action === 'IS_SYSTEM_ADMIN')
    );

    for (const superAdminRole of superAdminRoles) {
      // Clean existing mappings to avoid duplicates or stale perms
      await prisma.rolePermission.deleteMany({ where: { role_id: superAdminRole.id } });

      await prisma.rolePermission.createMany({
        data: tenantDbPermissions.map(p => ({
          role_id: superAdminRole.id,
          permission_id: p.id
        }))
      });
    }
    console.log(`Mapped ${tenantDbPermissions.length} tenant permissions to ${superAdminRoles.length} SUPER_ADMIN roles.`);
  }

  // 5. Map subset to MANAGEMENT
  if (managementRole) {
    const mgmtPerms = await prisma.permission.findMany({
      where: {
        module: { in: ['USERS', 'ACADEMIC', 'ACADEMIC_STRUCTURE', 'TEACHER_ASSIGNMENT', 'ANALYTICS'] }
      }
    });

    await prisma.rolePermission.deleteMany({ where: { role_id: managementRole.id } });
    await prisma.rolePermission.createMany({
      data: mgmtPerms.map(p => ({
        role_id: managementRole.id,
        permission_id: p.id
      }))
    });
    console.log('Mapped management permissions.');
  }

  console.log('--- Permission Bootstrap Complete ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
