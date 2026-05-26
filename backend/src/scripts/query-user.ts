import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 20,
    include: { role: true, organization: true }
  });
  console.log('Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role?.name, org: u.organization?.school_name })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
