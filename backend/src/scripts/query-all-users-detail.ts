import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      role: true,
      organization: true
    }
  });

  console.log('--- ALL USERS IN DETAIL ---');
  for (const u of users) {
    console.log(`User: ${u.name} (${u.email})`);
    console.log(`  Organization: ${u.organization?.school_name} (${u.organization?.subdomain}) [ID: ${u.organization_id}]`);
    console.log(`  Role: ${u.role?.name} [ID: ${u.role_id}] Scoped To Org: ${u.role?.organization_id}`);
    console.log(`  Grade ID: ${u.grade_id}, Section ID: ${u.section_id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
