const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Grade';`;
  console.log('Grade columns:', result);
  const result2 = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'grades';`;
  console.log('grades columns:', result2);
}
run();
