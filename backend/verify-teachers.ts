import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const teachers = await prisma.user.findMany({
    where: { role: { name: 'TEACHER' } },
    select: { name: true, email: true }
  });
  console.log('TEACHERS_FOUND:', JSON.stringify(teachers));
  process.exit(0);
}
main();
