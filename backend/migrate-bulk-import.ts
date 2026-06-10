import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldPerms = await prisma.rolePermission.findMany({
    where: {
      permission: {
        module: 'USERS',
        action: 'BULK_IMPORT'
      }
    },
    include: { permission: true }
  });

  console.log(`Found ${oldPerms.length} old BULK_IMPORT role permissions`);

  // First, create the new permissions in the Permission table if they don't exist
  let importPerm = await prisma.permission.findFirst({ where: { module: 'USERS', action: 'IMPORT' } });
  if (!importPerm) {
    importPerm = await prisma.permission.create({ data: { module: 'USERS', action: 'IMPORT', description: 'Allows import in users module' } });
  }

  let exportPerm = await prisma.permission.findFirst({ where: { module: 'USERS', action: 'EXPORT' } });
  if (!exportPerm) {
    exportPerm = await prisma.permission.create({ data: { module: 'USERS', action: 'EXPORT', description: 'Allows export in users module' } });
  }

  for (const p of oldPerms) {
    // Add IMPORT
    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: p.role_id, permission_id: importPerm.id } },
      update: {},
      create: { role_id: p.role_id, permission_id: importPerm.id }
    });
    // Add EXPORT
    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: p.role_id, permission_id: exportPerm.id } },
      update: {},
      create: { role_id: p.role_id, permission_id: exportPerm.id }
    });
    // Delete BULK_IMPORT role_permission
    await prisma.rolePermission.delete({
      where: { role_id_permission_id: { role_id: p.role_id, permission_id: p.permission_id } }
    });
  }

  // Also delete BULK_IMPORT from Permission table
  await prisma.permission.deleteMany({
    where: { module: 'USERS', action: 'BULK_IMPORT' }
  });

  console.log('Migration completed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
