import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bulkImports = await prisma.rolePermission.count({
    where: { permission: { action: 'BULK_IMPORT' } }
  });
  const imports = await prisma.rolePermission.count({
    where: { permission: { action: 'IMPORT' } }
  });
  const exports = await prisma.rolePermission.count({
    where: { permission: { action: 'EXPORT' } }
  });

  console.log({ bulkImports, imports, exports });
}

main().catch(console.error).finally(() => prisma.$disconnect());
