import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  
  const studentRoles = await prisma.role.findMany({
    where: {
      organization_id: orgId,
      permissions: {
        some: {
          permission: { module: 'IDENTITY', action: 'IS_STUDENT' }
        }
      }
    },
    select: { id: true }
  });
  const studentRoleIds = studentRoles.map(r => r.id);

  console.log('Student role IDs:', studentRoleIds);

  const totalStudentUsers = await prisma.user.count({
    where: { organization_id: orgId, role_id: { in: studentRoleIds }, is_active: true }
  });
  console.log('Total Student Users (active, all years):', totalStudentUsers);

  const years = await prisma.academicYear.findMany({ where: { organization_id: orgId } });
  for (const year of years) {
    const enrollmentsCount = await prisma.studentEnrollment.count({
      where: { organization_id: orgId, academic_year_id: year.id }
    });
    const enrollmentsActiveStudentCount = await prisma.studentEnrollment.count({
      where: {
        organization_id: orgId,
        academic_year_id: year.id,
        student: { is_active: true }
      }
    });
    console.log(`Year: ${year.name} (ID: ${year.id})`);
    console.log(`  Total Enrollments: ${enrollmentsCount}`);
    console.log(`  Active Enrolled Students: ${enrollmentsActiveStudentCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
