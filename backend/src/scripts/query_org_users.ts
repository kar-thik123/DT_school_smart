import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  const users = await prisma.user.findMany({
    where: { organization_id: orgId },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } }
    }
  });

  console.log(`USERS IN ORG ${orgId}:`);
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
