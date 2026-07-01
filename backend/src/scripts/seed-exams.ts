import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org_id = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  const yearId = '182480cb-b0f9-4eb8-af1d-dc19cea211a4'; // 2026-2027

  console.log('--- SEEDING EXAMS AND RESULTS ---');

  // Find some students in Grade 10 and 11
  const grade10Students = await prisma.user.findMany({
    where: { organization_id: org_id, grade_id: 'c9c71dd7-fc6e-4349-b7ce-d8c7e27c4bdf', is_active: true },
    take: 10
  });

  const grade11Students = await prisma.user.findMany({
    where: { organization_id: org_id, grade_id: 'a9acab2f-fe59-4efd-9067-dbe4d9bc5429', is_active: true },
    take: 10
  });

  const allTargetStudents = [...grade10Students, ...grade11Students];
  console.log(`Found ${allTargetStudents.length} target students for seeding.`);

  if (allTargetStudents.length === 0) {
    console.log('No students found to seed exam results.');
    return;
  }

  // Create an admin user or use existing to set created_by
  const admin = await prisma.user.findFirst({
    where: { organization_id: org_id, role: { name: 'SUPER_ADMIN' } }
  });
  if (!admin) {
    console.log('Admin user not found.');
    return;
  }

  // Create an Examination
  const exam = await prisma.examination.create({
    data: {
      exam_name: 'Quarterly Examination',
      organization_id: org_id,
      academic_year_id: yearId,
      created_by: admin.id
    }
  });
  console.log(`Created exam: ${exam.exam_name} (ID: ${exam.id})`);

  // Subjects for Grade 10 & 11
  const grade10Subjects = await prisma.subject.findMany({ where: { grade_id: 'c9c71dd7-fc6e-4349-b7ce-d8c7e27c4bdf' } });
  const grade11Subjects = await prisma.subject.findMany({ where: { grade_id: 'a9acab2f-fe59-4efd-9067-dbe4d9bc5429' } });

  for (const s of grade10Students) {
    // Generate simulated marks (some passing, some failing to test weak subjects & risk radar)
    // Student 1 & 2 -> Critical (avg < 30%)
    // Student 3 & 4 -> High Risk (avg 30-50%)
    // Others -> Passed (avg > 70%)
    const index = grade10Students.indexOf(s);
    let avgScore = 75;
    if (index === 0) avgScore = 22; // Critical
    else if (index === 1) avgScore = 28; // Critical
    else if (index === 2) avgScore = 38; // High Risk
    else if (index === 3) avgScore = 45; // High Risk

    const result = await prisma.studentExamResult.create({
      data: {
        examination_id: exam.id,
        student_id: s.id,
        organization_id: org_id,
        academic_year_id: yearId,
        grade_id: 'c9c71dd7-fc6e-4349-b7ce-d8c7e27c4bdf',
        section_id: s.section_id,
        total_max_marks: 500,
        total_obtained_marks: (500 * avgScore) / 100,
        percentage: avgScore,
        result_status: avgScore >= 40 ? 'PASS' : 'FAIL',
        created_by: admin.id
      }
    });

    // Seed Subject Results
    for (const sub of grade10Subjects.slice(0, 5)) {
      // Make Mathematics and Physics particularly weak
      let subScore = avgScore;
      if (sub.name.toLowerCase().includes('math') || sub.name.toLowerCase().includes('physic')) {
        subScore = Math.max(avgScore - 15, 10);
      } else {
        subScore = Math.min(avgScore + 10, 98);
      }

      await prisma.studentExamSubjectResult.create({
        data: {
          student_exam_result_id: result.id,
          subject_id: sub.id,
          max_marks: 100,
          obtained_marks: subScore,
          pass_marks: 40,
          status: subScore >= 40 ? 'PASS' : 'FAIL'
        }
      });
    }
  }

  for (const s of grade11Students) {
    const index = grade11Students.indexOf(s);
    let avgScore = 80;
    if (index === 0) avgScore = 25; // Critical
    else if (index === 1) avgScore = 42; // High Risk

    const result = await prisma.studentExamResult.create({
      data: {
        examination_id: exam.id,
        student_id: s.id,
        organization_id: org_id,
        academic_year_id: yearId,
        grade_id: 'a9acab2f-fe59-4efd-9067-dbe4d9bc5429',
        section_id: s.section_id,
        total_max_marks: 300,
        total_obtained_marks: (300 * avgScore) / 100,
        percentage: avgScore,
        result_status: avgScore >= 40 ? 'PASS' : 'FAIL',
        created_by: admin.id
      }
    });

    for (const sub of grade11Subjects.slice(0, 3)) {
      let subScore = avgScore;
      await prisma.studentExamSubjectResult.create({
        data: {
          student_exam_result_id: result.id,
          subject_id: sub.id,
          max_marks: 100,
          obtained_marks: subScore,
          pass_marks: 40,
          status: subScore >= 40 ? 'PASS' : 'FAIL'
        }
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
