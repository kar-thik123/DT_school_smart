import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org_id = '1c9ad3bd-1c01-481e-8276-16ed612f52bc'; // St Michael higher secondary school
  const yearId = '182480cb-b0f9-4eb8-af1d-dc19cea211a4'; // 2026-2027 academic year

  console.log(`--- PROPOSED OVERVIEW METRICS FOR ORG: ${org_id}, YEAR: ${yearId} ---`);

  // 1. Roles
  const studentRoles = await prisma.role.findMany({
    where: {
      organization_id: org_id,
      permissions: {
        some: {
          permission: { module: 'IDENTITY', action: 'IS_STUDENT' }
        }
      },
      NOT: {
        permissions: {
          some: {
            permission: { module: 'IDENTITY', action: 'IS_SUPER_ADMIN' }
          }
        }
      }
    },
    select: { id: true, name: true }
  });
  const studentRoleIds = studentRoles.map(r => r.id);
  console.log('Student Roles:', studentRoles);

  const teacherRoles = await prisma.role.findMany({
    where: {
      organization_id: org_id,
      permissions: {
        some: {
          permission: { module: 'IDENTITY', action: 'IS_TEACHER' }
        }
      },
      NOT: {
        permissions: {
          some: {
            permission: { module: 'IDENTITY', action: 'IS_SUPER_ADMIN' }
          }
        }
      }
    },
    select: { id: true, name: true }
  });
  const teacherRoleIds = teacherRoles.map(r => r.id);
  console.log('Teacher Roles:', teacherRoles);

  // 2. Metrics
  const totalStudents = await prisma.studentEnrollment.count({
    where: {
      organization_id: org_id,
      academic_year_id: yearId,
      student: { is_active: true }
    }
  });

  const totalTeachers = await prisma.user.count({
    where: {
      organization_id: org_id,
      role_id: { in: teacherRoleIds },
      is_active: true
    }
  });

  const activeClasses = await prisma.section.count({
    where: {
      organization_id: org_id,
      grade: { academic_year_id: yearId }
    }
  });

  const totalAttendance = await prisma.studentAttendance.count({
    where: {
      organization_id: org_id,
      academic_year_id: yearId
    }
  });

  const excusedAttendance = await prisma.studentAttendance.count({
    where: {
      organization_id: org_id,
      academic_year_id: yearId,
      status: 'EXCUSED'
    }
  });

  const presentAttendance = await prisma.studentAttendance.count({
    where: {
      organization_id: org_id,
      academic_year_id: yearId,
      status: { in: ['PRESENT', 'LATE'] }
    }
  });

  const attendanceDenominator = totalAttendance - excusedAttendance;
  const overallAttendancePercent = attendanceDenominator > 0
    ? Math.round((presentAttendance / attendanceDenominator) * 100)
    : 0;

  // Let's print out all proposed variables
  console.log('\n--- CALCULATED VALUES ---');
  console.log('Total Students (Enrolled & Active):', totalStudents);
  console.log('Total Teachers (Active, excluding SuperAdmin):', totalTeachers);
  console.log('Active Classes (Sections in Academic Year):', activeClasses);
  console.log('Attendance %:', overallAttendancePercent, `(Present/Late: ${presentAttendance}, Denominator: ${attendanceDenominator}, Total Records: ${totalAttendance}, Excused: ${excusedAttendance})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
