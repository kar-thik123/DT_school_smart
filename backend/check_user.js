const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.findFirst({
    where: { email: 'sysadmin@platform.com' },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      },
      organization: true
    }
  });
  console.log(JSON.stringify(user, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
