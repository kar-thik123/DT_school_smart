const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const years = await prisma.academicYear.findMany({ where: { organization: { school_name: 'Govt school' } } });
  console.log(years);
}
run();
