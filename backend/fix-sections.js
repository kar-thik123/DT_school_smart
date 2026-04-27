const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSections() {
  const users = await prisma.user.findMany({
    where: { 
      grade_id: { not: null },
      section_id: null
    }
  });

  console.log(`Found ${users.length} users with missing section_id. Fixing...`);

  for (const user of users) {
    const section = await prisma.section.findFirst({
      where: { grade_id: user.grade_id, organization_id: user.organization_id }
    });

    if (section) {
      await prisma.user.update({
        where: { id: user.id },
        data: { section_id: section.id }
      });
      console.log(`Updated user ${user.name} with section ${section.name}`);
    } else {
      console.log(`WARNING: No section found for grade ${user.grade_id}. Cannot fix user ${user.name}`);
    }
  }

  await prisma.$disconnect();
}

fixSections()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
