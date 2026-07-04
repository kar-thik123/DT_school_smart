import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
  const org = await prisma.organization.findFirst({
    where: { subdomain: 'svvps' }
  });

  if (!org) {
    console.log('SVVPS org not found');
    return;
  }

  console.log(`Found SVVPS: ${org.id}`);

  try {
    await prisma.organization.delete({
      where: { id: org.id }
    });
    console.log('Successfully deleted!');
  } catch (err) {
    console.error('Delete failed:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
