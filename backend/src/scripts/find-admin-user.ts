import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  
  const admins = await prisma.user.findMany({
    where: {
      organization_id: orgId,
      role: {
        name: { in: ['SUPER_ADMIN', 'MANAGEMENT'] }
      }
    },
    select: {
      name: true,
      email: true,
      role: { select: { name: true } }
    }
  });

  console.log('--- ADMIN USERS FOR LOGIN ---');
  console.log(admins);
}

main().catch(console.error).finally(() => prisma.$disconnect());
