import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`TRUNCATE TABLE student_dashboard_summaries CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE student_dashboard_weekly_trends CASCADE;`;
  console.log('Cleared summary tables.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
