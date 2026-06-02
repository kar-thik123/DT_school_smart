const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const skillsCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'skills';`;
  console.log('Skills columns in DB:', skillsCols.map(c => c.column_name));
  
  const gradesCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'grades';`;
  console.log('Grades columns in DB:', gradesCols.map(c => c.column_name));
}
run();
