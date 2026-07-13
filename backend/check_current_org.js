const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const org = await prisma.organization.findUnique({
    where: { id: '0f928784-d039-436b-bc42-0e17fb33fd8c' }
  });
  console.log("KMHSS Org details:", JSON.stringify(org, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
