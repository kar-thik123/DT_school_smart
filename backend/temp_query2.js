const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const orgs = await prisma.organization.findMany({ select: { school_name: true, domain_type: true } });
  console.log(orgs);
}
run();
