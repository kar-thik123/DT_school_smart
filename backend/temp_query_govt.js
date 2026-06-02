const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.findUnique({
    where: { email: 'govt@gmail.com' },
    include: { organization: true }
  });
  console.log(JSON.stringify(user?.organization, null, 2));
}
run();
