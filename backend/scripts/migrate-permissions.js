const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating READ to VIEW and EDIT to UPDATE...');
  const updatedViews = await prisma.permission.updateMany({
    where: { action: 'READ' },
    data: { action: 'VIEW' }
  });
  console.log(`Updated ${updatedViews.count} READ actions to VIEW.`);

  const updatedUpdates = await prisma.permission.updateMany({
    where: { action: 'EDIT' },
    data: { action: 'UPDATE' }
  });
  console.log(`Updated ${updatedUpdates.count} EDIT actions to UPDATE.`);

  console.log('Migration complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
