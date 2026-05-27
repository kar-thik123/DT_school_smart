import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN' },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });
  console.log('superAdminRole:', superAdminRole);
}

main().catch(console.error).finally(() => prisma.$disconnect());
