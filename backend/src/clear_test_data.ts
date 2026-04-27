import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing academic test data...');
  // Only delete test data (e.g. starting with 'New', 'Test', 'Updated', 'Board', 'Medium')
  // Or just clear all if it's a dev DB
  await prisma.board.deleteMany({});
  await prisma.medium.deleteMany({});
  await prisma.academicYear.deleteMany({});
  await prisma.organizationType.deleteMany({});
  console.log('Academic test data cleared.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
