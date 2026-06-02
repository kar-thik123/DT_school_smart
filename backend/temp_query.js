const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(tables.filter(t => t.table_name.includes('skill')));
}
run();
