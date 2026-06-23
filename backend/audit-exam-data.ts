import prisma from './src/prisma';

async function run() {
  console.log('=== STUDENT EXAM RESULT DATA QUALITY AUDIT ===\n');

  // PHASE 1
  console.log('--- PHASE 1: EXAMINATION DATA INVENTORY ---');
  const totalExams = await prisma.examination.count();
  const totalResults = await prisma.studentExamResult.count();
  const totalSubjects = await prisma.studentExamSubjectResult.count();
  console.log(`Total Examinations: ${totalExams}`);
  console.log(`Total Student Results: ${totalResults}`);
  console.log(`Total Subject Result Rows: ${totalSubjects}`);

  // Fetch breakdown
  const exams = await prisma.examination.findMany({
    include: {
      student_exam_results: {
        select: { id: true, grade_id: true, section_id: true }
      },
      academic_year: true
    }
  });

  for (const e of exams) {
    const studentCount = e.student_exam_results.length;
    const grades = [...new Set(e.student_exam_results.map(r => r.grade_id))];
    console.log(`- Exam: ${e.exam_name} | Year: ${e.academic_year.name} | Grades: ${grades.length} | Students: ${studentCount}`);
  }

  // Load all results with subject marks
  const results = await prisma.studentExamResult.findMany({
    include: { subject_results: true, student: { select: { name: true } }, examination: { select: { exam_name: true } } }
  });

  console.log('\n--- PHASE 2: TOTAL MARKS VALIDATION ---');
  let marksPass = 0, marksFail = 0;
  for (const r of results) {
    const calcObtained = r.subject_results.reduce((sum, sub) => sum + sub.obtained_marks, 0);
    if (Math.abs(calcObtained - (r.total_obtained_marks || 0)) > 0.1) {
      console.log(`FAIL: Result ${r.id} | Calc: ${calcObtained} != Stored: ${r.total_obtained_marks}`);
      marksFail++;
    } else {
      marksPass++;
    }
  }
  console.log(`Total Marks Validation: PASS ${marksPass} | FAIL ${marksFail}`);

  console.log('\n--- PHASE 3: MAXIMUM MARKS VALIDATION ---');
  let maxPass = 0, maxFail = 0;
  for (const r of results) {
    const calcMax = r.subject_results.reduce((sum, sub) => sum + sub.max_marks, 0);
    if (Math.abs(calcMax - (r.total_max_marks || 0)) > 0.1) {
      console.log(`FAIL: Result ${r.id} | Calc Max: ${calcMax} != Stored Max: ${r.total_max_marks}`);
      maxFail++;
    } else {
      maxPass++;
    }
  }
  console.log(`Max Marks Validation: PASS ${maxPass} | FAIL ${maxFail}`);

  console.log('\n--- PHASE 4: PERCENTAGE VALIDATION ---');
  let percPass = 0, percFail = 0;
  for (const r of results) {
    const calcMax = r.subject_results.reduce((sum, sub) => sum + sub.max_marks, 0);
    const calcObtained = r.subject_results.reduce((sum, sub) => sum + sub.obtained_marks, 0);
    const calcPerc = calcMax > 0 ? (calcObtained / calcMax) * 100 : 0;
    const storedPerc = r.percentage || 0;
    
    if (Math.abs(calcPerc - storedPerc) > 0.01) {
      console.log(`FAIL: Student ${r.student.name} | Exam ${r.examination.exam_name} | Stored: ${storedPerc.toFixed(2)}% | Calc: ${calcPerc.toFixed(2)}% | Diff: ${Math.abs(calcPerc - storedPerc).toFixed(2)}`);
      percFail++;
    } else {
      percPass++;
    }
  }
  console.log(`Percentage Validation: PASS ${percPass} | FAIL ${percFail}`);

  console.log('\n--- PHASE 5: SUBJECT PERCENTAGE VALIDATION ---');
  let subInvalid = 0;
  const allSubjects = await prisma.studentExamSubjectResult.findMany();
  for (const sub of allSubjects) {
    if (sub.obtained_marks > sub.max_marks) {
      console.log(`INVALID: SubjectResult ${sub.id} | Obtained (${sub.obtained_marks}) > Max (${sub.max_marks})`);
      subInvalid++;
    }
    if (sub.obtained_marks < 0 || sub.max_marks <= 0) {
      console.log(`INVALID: SubjectResult ${sub.id} | Negative or Zero Max Marks`);
      subInvalid++;
    }
  }
  console.log(`Total Invalid Subject Rows: ${subInvalid}`);

  console.log('\n--- PHASE 6 & 7: GRADE AND STATUS VALIDATION ---');
  let gradeFail = 0, statusFail = 0;
  for (const r of results) {
    const calcMax = r.subject_results.reduce((sum, sub) => sum + sub.max_marks, 0);
    const calcObtained = r.subject_results.reduce((sum, sub) => sum + sub.obtained_marks, 0);
    const calcPerc = calcMax > 0 ? (calcObtained / calcMax) * 100 : 0;
    
    let calcGrade = 'FAIL';
    if (calcPerc >= 90) calcGrade = 'A+';
    else if (calcPerc >= 80) calcGrade = 'A';
    else if (calcPerc >= 70) calcGrade = 'B+';
    else if (calcPerc >= 60) calcGrade = 'B';
    else if (calcPerc >= 50) calcGrade = 'C';
    
    const calcStatus = calcPerc >= 50 ? 'PASS' : 'FAIL';
    
    if (r.grade !== calcGrade) {
      console.log(`FAIL GRADE: Result ${r.id} | Stored: ${r.grade} | Calc: ${calcGrade}`);
      gradeFail++;
    }
    if (r.result_status !== calcStatus) {
      console.log(`FAIL STATUS: Result ${r.id} | Stored: ${r.result_status} | Calc: ${calcStatus}`);
      statusFail++;
    }
  }
  console.log(`Grade Validation Mismatches: ${gradeFail}`);
  console.log(`Status Validation Mismatches: ${statusFail}`);

  console.log('\n--- PHASE 8 & 9: DUPLICATES AND ORPHANS ---');
  const dupes = await prisma.$queryRaw`
    SELECT examination_id, student_id, COUNT(*) as cnt
    FROM student_exam_results
    GROUP BY examination_id, student_id
    HAVING COUNT(*) > 1
  `;
  console.log(`Duplicates Exam Results (same exam + student): ${(dupes as any[]).length}`);

  const orphanResults = await prisma.studentExamResult.count({ where: { examination: { is: null } } });
  const orphanSubjects = await prisma.studentExamSubjectResult.count({ where: { student_exam_result: { is: null } } });
  console.log(`Orphan Results: ${orphanResults} | Orphan Subjects: ${orphanSubjects}`);

  console.log('\n--- PHASE 10: HISTORICAL ANALYTICS READINESS ---');
  const counts = await prisma.$queryRaw`
    SELECT student_id, COUNT(*) as cnt
    FROM student_exam_results
    GROUP BY student_id
  `;
  const hist = { '1': 0, '2': 0, '3': 0, '4+': 0 };
  for (const c of counts as any[]) {
    const n = Number(c.cnt);
    if (n === 1) hist['1']++;
    else if (n === 2) hist['2']++;
    else if (n === 3) hist['3']++;
    else if (n >= 4) hist['4+']++;
  }
  console.log(`Students with 1 Exam: ${hist['1']}`);
  console.log(`Students with 2 Exams: ${hist['2']}`);
  console.log(`Students with 3 Exams: ${hist['3']}`);
  console.log(`Students with 4+ Exams: ${hist['4+']}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
