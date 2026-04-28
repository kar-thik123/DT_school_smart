import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log("No organization found. Please run seed.ts first.");
    return;
  }

  const roleNames = ['SYSTEM_ADMIN', 'MANAGEMENT', 'TEACHER', 'STUDENT'];

  for (const name of roleNames) {
    const exists = await prisma.role.findFirst({ where: { name } });
    if (!exists) {
      await prisma.role.create({
        data: {
          name,
          description: `System ${name} role`,
          is_system: true,
          is_teaching_role: name === 'TEACHER',
          organization_id: org.id
        }
      });
      console.log(`Created role: ${name}`);
    } else {
      console.log(`Role already exists: ${name}`);
    }
  }

  console.log('Role seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
