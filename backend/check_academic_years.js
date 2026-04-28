const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const years = await prisma.academicYear.findMany();
  console.log('Academic Years:', JSON.stringify(years, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
