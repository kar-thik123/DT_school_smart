import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org_id = '1c9ad3bd-1c01-481e-8276-16ed612f52bc'; // St Michael
  const yearId = '182480cb-b0f9-4eb8-af1d-dc19cea211a4'; // 2026-2027

  console.log('--- WIDGETS 3-7 DB AUDIT & VERIFICATION ---');

  // 1. Examination Summary
  console.log('\n--- 1. Examination Summary ---');
  const latestExam = await prisma.examination.findFirst({
    where: { organization_id: org_id, academic_year_id: yearId },
    orderBy: { created_at: 'desc' }
  });
  if (latestExam) {
    console.log(`Latest Exam: "${latestExam.exam_name}" (ID: ${latestExam.id})`);
    const results = await prisma.studentExamResult.findMany({ where: { examination_id: latestExam.id } });
    console.log(`Results Found: ${results.length}`);
    if (results.length > 0) {
      const scores = results.map(r => r.percentage || 0);
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const maxScore = Math.round(Math.max(...scores));
      const minScore = Math.round(Math.min(...scores));
      console.log(`Calculated -> Avg: ${avgScore}%, Highest: ${maxScore}%, Lowest: ${minScore}%, Appeared: ${results.length}`);
    }
  } else {
    console.log('No exams found.');
  }

  // 2. Teacher Performance
  console.log('\n--- 2. Teacher Performance ---');
  const teacherRoles = await prisma.role.findMany({
    where: {
      organization_id: org_id,
      permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_TEACHER' } } },
      NOT: { permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_SUPER_ADMIN' } } } }
    },
    select: { id: true }
  });
  const teacherRoleIds = teacherRoles.map(r => r.id);
  const teachers = await prisma.user.findMany({
    where: { organization_id: org_id, role_id: { in: teacherRoleIds }, is_active: true },
    include: { teacher_assignments: { where: { academic_year_id: yearId }, include: { subject: true } } }
  });
  console.log(`Teachers count: ${teachers.length}`);
  teachers.forEach(t => {
    console.log(`- Teacher: ${t.name}, Assigned Subjects: ${t.teacher_assignments.map(a => a.subject?.name).join(', ')}`);
  });

  // 3. Weak Subjects
  console.log('\n--- 3. Weak Subjects ---');
  const exams = await prisma.examination.findMany({ where: { organization_id: org_id, academic_year_id: yearId } });
  if (exams.length > 0) {
    const examIds = exams.map(e => e.id);
    const subjectResults = await prisma.studentExamSubjectResult.findMany({
      where: { student_exam_result: { examination_id: { in: examIds } } },
      include: { subject: true }
    });
    const subStats = new Map<string, { total: number, max: number, name: string }>();
    for (const r of subjectResults) {
      if (!subStats.has(r.subject_id)) {
        subStats.set(r.subject_id, { total: 0, max: 0, name: r.subject.name });
      }
      const s = subStats.get(r.subject_id)!;
      s.total += r.obtained_marks;
      s.max += r.max_marks;
    }
    console.log('Subject Averages (< 50% are weak):');
    for (const [sid, s] of subStats.entries()) {
      const avg = Math.round((s.total / s.max) * 100);
      console.log(`- ${s.name}: ${avg}% ${avg < 50 ? '[WEAK]' : ''}`);
    }
  } else {
    console.log('No exams to evaluate weak subjects.');
  }

  // 4. Student Risk
  console.log('\n--- 4. Student Risk ---');
  const examResults = await prisma.studentExamResult.findMany({
    where: { organization_id: org_id, academic_year_id: yearId },
    include: { student: true }
  });
  const studentStats = new Map<string, { total: number, count: number, name: string }>();
  for (const r of examResults) {
    if (!studentStats.has(r.student_id)) {
      studentStats.set(r.student_id, { total: 0, count: 0, name: r.student.name });
    }
    const s = studentStats.get(r.student_id)!;
    s.total += r.percentage || 0;
    s.count++;
  }
  let atRiskCount = 0;
  for (const [sid, s] of studentStats.entries()) {
    const avg = Math.round(s.total / s.count);
    if (avg < 50) {
      atRiskCount++;
      console.log(`- At Risk: ${s.name}, Avg Score: ${avg}%, Risk: ${avg < 30 ? 'Critical' : 'High'}`);
    }
  }
  console.log(`Total students at risk (< 50%): ${atRiskCount}`);

  // 5. Recent Activity
  console.log('\n--- 5. Recent Activity ---');
  const logs = await prisma.auditLog.findMany({
    where: { organization_id: org_id },
    orderBy: { timestamp: 'desc' },
    take: 5
  });
  console.log(`Audit logs count: ${logs.length}`);
  logs.forEach(l => {
    console.log(`- Log: ${l.user_name} did ${l.action_type} on ${l.entity_type} at ${l.timestamp}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
