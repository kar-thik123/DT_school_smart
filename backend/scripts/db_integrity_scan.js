const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function scan() {
  const anomalies = [];
  
  // 1. Users -> Roles
  const usersWithRoles = await prisma.user.findMany({
    include: { role: true },
  });
  for (const u of usersWithRoles) {
    if (u.role && u.role.organization_id && u.organization_id !== u.role.organization_id) {
      anomalies.push(`Cross-tenant: User ${u.id} (${u.organization_id}) -> Role ${u.role.id} (${u.role.organization_id})`);
    }
  }

  // 2. Users -> Grades
  const usersWithGrades = await prisma.user.findMany({
    include: { grade: true },
  });
  for (const u of usersWithGrades) {
    if (u.grade && u.organization_id !== u.grade.organization_id) {
      anomalies.push(`Cross-tenant: User ${u.id} (${u.organization_id}) -> Grade ${u.grade.id} (${u.grade.organization_id})`);
    }
  }

  // 3. Users -> Sections
  const usersWithSections = await prisma.user.findMany({
    include: { section: true },
  });
  for (const u of usersWithSections) {
    if (u.section && u.organization_id !== u.section.organization_id) {
      anomalies.push(`Cross-tenant: User ${u.id} (${u.organization_id}) -> Section ${u.section.id} (${u.section.organization_id})`);
    }
  }

  // 4. Student Enrollments
  const enrollments = await prisma.studentEnrollment.findMany({
    include: { student: true, grade: true, section: true }
  });
  for (const e of enrollments) {
    if (e.organization_id !== e.student.organization_id) {
      anomalies.push(`Cross-tenant: Enrollment ${e.id} (${e.organization_id}) -> Student ${e.student.id} (${e.student.organization_id})`);
    }
    if (e.organization_id !== e.grade.organization_id) {
      anomalies.push(`Cross-tenant: Enrollment ${e.id} (${e.organization_id}) -> Grade ${e.grade.id} (${e.grade.organization_id})`);
    }
    if (e.section && e.organization_id !== e.section.organization_id) {
      anomalies.push(`Cross-tenant: Enrollment ${e.id} (${e.organization_id}) -> Section ${e.section.id} (${e.section.organization_id})`);
    }
  }

  // 5. Teacher Assignments (SubjectTeacher)
  const assignments = await prisma.subjectTeacher.findMany({
    include: { teacher: true, subject: true, section: true }
  });
  for (const a of assignments) {
    if (a.organization_id !== a.teacher.organization_id) {
      anomalies.push(`Cross-tenant: SubjectTeacher ${a.id} (${a.organization_id}) -> Teacher ${a.teacher.id} (${a.teacher.organization_id})`);
    }
    if (a.organization_id !== a.subject.organization_id) {
      anomalies.push(`Cross-tenant: SubjectTeacher ${a.id} (${a.organization_id}) -> Subject ${a.subject.id} (${a.subject.organization_id})`);
    }
    if (a.section && a.organization_id !== a.section.organization_id) {
      anomalies.push(`Cross-tenant: SubjectTeacher ${a.id} (${a.organization_id}) -> Section ${a.section.id} (${a.section.organization_id})`);
    }
  }

  // 6. Subjects -> Grade
  const subjects = await prisma.subject.findMany({ include: { grade: true } });
  for (const s of subjects) {
    if (s.grade && s.organization_id !== s.grade.organization_id) {
      anomalies.push(`Cross-tenant: Subject ${s.id} (${s.organization_id}) -> Grade ${s.grade.id} (${s.grade.organization_id})`);
    }
  }

  // 7. Examinations
  const exams = await prisma.examination.findMany({ include: { academic_year: true } });
  for (const e of exams) {
    if (e.academic_year && e.organization_id !== e.academic_year.organization_id) {
      anomalies.push(`Cross-tenant: Examination ${e.id} (${e.organization_id}) -> AcademicYear ${e.academic_year.id} (${e.academic_year.organization_id})`);
    }
  }

  // 8. Attendance (StudentAttendance)
  const attendances = await prisma.studentAttendance.findMany({ include: { student: true } });
  for (const a of attendances) {
    if (a.organization_id !== a.student.organization_id) {
      anomalies.push(`Cross-tenant: Attendance ${a.id} (${a.organization_id}) -> Student ${a.student.id} (${a.student.organization_id})`);
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
