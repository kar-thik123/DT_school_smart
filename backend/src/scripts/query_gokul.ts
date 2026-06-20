import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'student001@schooldemo.com';
  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      enrollments: {
        include: {
          grade: true,
          section: true,
          subject_group: true,
          academic_year: true
        }
      }
    }
  });

  console.log('USER DETAILS:');
  console.log(JSON.stringify(user, null, 2));

  // Find active academic year for organization
  if (user) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organization_id }
    });
    console.log('\nORGANIZATION DETAILS:');
    console.log(JSON.stringify(org, null, 2));

    const activeAY = await prisma.academicYear.findFirst({
      where: { organization_id: user.organization_id, is_active: true }
    });
    console.log('\nACTIVE ACADEMIC YEAR:');
    console.log(JSON.stringify(activeAY, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
