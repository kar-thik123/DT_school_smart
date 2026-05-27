import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'karthik2jonam@gmail.com' },
    include: { role: true, organization: true }
  });
  console.log('User:', user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
