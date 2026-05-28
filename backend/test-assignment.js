const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const org = await prisma.organization.findFirst();
  const year = await prisma.academicYear.findFirst();
  const grade = await prisma.grade.findFirst();
  const section = await prisma.section.findFirst();
  const subject = await prisma.subject.findFirst();
  const teacher = await prisma.user.findFirst({
    where: { role: { name: { contains: 'Teacher', mode: 'insensitive' } } }
  });

  if (!org || !year || !grade || !section || !subject || !teacher) {
    console.log('Missing data to test');
    return;
  }

  console.log('Found data:', { org: org.id, year: year.id, grade: grade.id, section: section.id, subject: subject.id, teacher: teacher.id });

  try {
    const res = await prisma.teacherAssignment.createMany({
      data: [{
        organization_id: org.id,
        academic_year_id: year.id,
        grade_id: grade.id,
        section_id: section.id,
        subject_id: subject.id,
        teacher_id: teacher.id,
        assignment_type: 'SUBJECT_TEACHER'
      }],
      skipDuplicates: true
    });
    console.log('Success:', res);
  } catch (e) {
    console.error('Error in createMany:', e);
  }
}

check();
