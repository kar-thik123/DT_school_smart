const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function scan() {
  const anomalies = [];
  
  // 1. Users -> Roles
  const usersWithRoles = await prisma.user.findMany({ include: { role: true } });
  for (const u of usersWithRoles) {
    if (u.role && u.role.organization_id && u.organization_id !== u.role.organization_id) {
      anomalies.push(`Cross-tenant: User ${u.id} (${u.organization_id}) -> Role ${u.role.id} (${u.role.organization_id})`);
    }
  }

  // 2. Users -> Grades
  const usersWithGrades = await prisma.user.findMany({ include: { grade: true } });
  for (const u of usersWithGrades) {
    if (u.grade && u.organization_id !== u.grade.organization_id) {
      anomalies.push(`Cross-tenant: User ${u.id} (${u.organization_id}) -> Grade ${u.grade.id} (${u.grade.organization_id})`);
    }
  }

  // 3. Users -> Sections
  const usersWithSections = await prisma.user.findMany({ include: { section: true } });
  for (const u of usersWithSections) {
    if (u.section && u.organization_id !== u.section.organization_id) {
      anomalies.push(`Cross-tenant: User ${u.id} (${u.organization_id}) -> Section ${u.section.id} (${u.section.organization_id})`);
    }
  }

  // 4. Student Enrollments
  const enrollments = await prisma.studentEnrollment.findMany({ include: { student: true, grade: true, section: true } });
  for (const e of enrollments) {
    if (e.organization_id !== e.student.organization_id) {
      anomalies.push(`Cross-tenant: Enrollment ${e.id} (${e.organization_id}) -> Student ${e.student.id} (${e.student.organization_id})`);
    }
    if (e.grade && e.organization_id !== e.grade.organization_id) {
      anomalies.push(`Cross-tenant: Enrollment ${e.id} (${e.organization_id}) -> Grade ${e.grade.id} (${e.grade.organization_id})`);
    }
    if (e.section && e.organization_id !== e.section.organization_id) {
      anomalies.push(`Cross-tenant: Enrollment ${e.id} (${e.organization_id}) -> Section ${e.section.id} (${e.section.organization_id})`);
    }
  }

  if (anomalies.length > 0) {
    console.log('ANOMALIES FOUND:');
    console.log(anomalies.join('\n'));
  } else {
    console.log('No cross-tenant anomalies found. Database integrity scan passed.');
  }
}

scan().catch(console.error).finally(() => prisma.$disconnect());
