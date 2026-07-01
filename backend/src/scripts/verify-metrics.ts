import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc'; // St Michael higher secondary school
  console.log(`--- VERIFYING METRICS FOR ORG: ${orgId} ---`);

  // 1. Roles
  const roles = await prisma.role.findMany({
    where: { organization_id: orgId },
    include: { permissions: { include: { permission: true } } }
  });

  const studentRole = roles.find(r => r.permissions.some(p => p.permission.module === 'IDENTITY' && p.permission.action === 'IS_STUDENT'));
  const teacherRole = roles.find(r => r.permissions.some(p => p.permission.module === 'IDENTITY' && p.permission.action === 'IS_TEACHER'));

  console.log('Student Role ID:', studentRole?.id, 'Name:', studentRole?.name);
  console.log('Teacher Role ID:', teacherRole?.id, 'Name:', teacherRole?.name);

  // 2. Active Academic Years
  const years = await prisma.academicYear.findMany({
    where: { organization_id: orgId }
  });
  console.log('Academic Years:', years);

  const activeYear = years.find(y => y.is_active);
  console.log('Active Academic Year:', activeYear);

  if (!activeYear) {
    console.log('No active year found.');
    return;
  }

  // 3. Student Count
  const studentCount = await prisma.user.count({
    where: {
      organization_id: orgId,
      role_id: studentRole?.id,
      is_active: true
    }
  });
  console.log('Active Student Count from users (filtered by role):', studentCount);

  // 4. Teacher Count
  const teacherCount = await prisma.user.count({
    where: {
      organization_id: orgId,
      role_id: teacherRole?.id,
      is_active: true
    }
  });
  console.log('Active Teacher Count from users (filtered by role):', teacherCount);

  // 5. Active Classes Count
  const sectionsCount = await prisma.section.count({
    where: { organization_id: orgId }
  });
  console.log('Total Sections (Classes):', sectionsCount);

  const gradesCount = await prisma.grade.count({
    where: { organization_id: orgId, academic_year_id: activeYear.id }
  });
  console.log('Grades in Active Year:', gradesCount);

  // 6. Attendance Count
  const attendanceCount = await prisma.studentAttendance.count({
    where: { organization_id: orgId, academic_year_id: activeYear.id }
  });
  console.log('StudentAttendance records count:', attendanceCount);

  // 7. Practice Attempts Count
  const attemptsCount = await prisma.practiceAttempt.count({
    where: { organization_id: orgId, academic_year_id: activeYear.id }
  });
  console.log('Practice Attempts Count:', attemptsCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
