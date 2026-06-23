import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  console.log('ROLES:');
  console.log(JSON.stringify(roles, null, 2));

  const users = await prisma.user.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } }
    }
  });
  console.log('\nUSERS (take 10):');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
