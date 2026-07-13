const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.findFirst({
    where: { email: 'karthik6112001@gmail.com' }
  });
  console.log("User details:", JSON.stringify(user, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
