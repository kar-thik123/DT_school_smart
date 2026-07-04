const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.findFirst({ where: { email: 'system@gmail.com' }, include: { role: true, organization: true } });
  console.log(user);
}
run();
