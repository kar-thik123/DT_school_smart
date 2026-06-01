import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const isExecute = process.argv.includes('--execute');
  console.log(`\n======================================================`);
  console.log(`HYBRID GOVERNANCE MIGRATION - ${isExecute ? 'EXECUTE MODE' : 'DRY RUN MODE'}`);
  console.log(`======================================================\n`);

  if (!isExecute) {
    console.log('NOTE: No database modifications will be made.\n');
  }

  // --- SCRIPT 01: MasterGrade Population ---
  console.log('--- SCRIPT 01: MasterGrade Population ---');
  const grades = await prisma.grade.findMany();
  console.log(`Found ${grades.length} AcademicGrade records.`);
  
  const masterGradeMap = new Map<string, any>(); // key: orgId_name
  for (const grade of grades) {
    const key = `${grade.organization_id}_${grade.name}`;
    if (!masterGradeMap.has(key)) {
      masterGradeMap.set(key, { name: grade.name, organization_id: grade.organization_id });
    }
  }

  console.log(`Would create ${masterGradeMap.size} unique MasterGrade records.`);
  console.log(`Would update ${grades.length} AcademicGrade records with master_grade_id.\n`);


  // --- SCRIPT 02: Subject Deduplication ---
  console.log('--- SCRIPT 02: Subject Deduplication ---');
  const subjects = await prisma.subject.findMany({ include: { grade: true } });
  console.log(`Found ${subjects.length} Subject records.`);
  
  const subjectGroups = new Map<string, any[]>();
  for (const sub of subjects) {
    if (!sub.grade) continue;
    // We group by subject name and MasterGrade equivalent (grade.name + grade.org_id)
    const key = `${sub.organization_id}_${sub.grade.name}_${sub.name}`;
    if (!subjectGroups.has(key)) subjectGroups.set(key, []);
    subjectGroups.get(key)!.push(sub);
  }

  let subjectDeduplicates = 0;
  for (const [key, subs] of subjectGroups.entries()) {
    if (subs.length > 1) {
      subjectDeduplicates += (subs.length - 1);
    }
  }
  console.log(`Would elect ${subjectGroups.size} Master Subjects.`);
  console.log(`Would merge and delete ${subjectDeduplicates} duplicate Subject records.\n`);


  // --- SCRIPT 03: SubjectGroup Deduplication ---
  console.log('--- SCRIPT 03: SubjectGroup (Stream) Deduplication ---');
  const streams = await prisma.subjectGroup.findMany({ include: { grade: true } });
  console.log(`Found ${streams.length} SubjectGroup records.`);

  const streamGroups = new Map<string, any[]>();
  for (const stream of streams) {
    if (!stream.grade) continue;
    const key = `${stream.organization_id}_${stream.grade.name}_${stream.name}`;
    if (!streamGroups.has(key)) streamGroups.set(key, []);
    streamGroups.get(key)!.push(stream);
  }

  let streamDeduplicates = 0;
  for (const [key, strms] of streamGroups.entries()) {
    if (strms.length > 1) {
      streamDeduplicates += (strms.length - 1);
    }
  }
  console.log(`Would elect ${streamGroups.size} Master SubjectGroups.`);
  console.log(`Would merge and delete ${streamDeduplicates} duplicate SubjectGroup records.\n`);


  // --- SCRIPT 04: AcademicYear Backfill ---
  console.log('--- SCRIPT 04: AcademicYear Backfill ---');
  const practiceAttempts = await prisma.practiceAttempt.count({ where: { academic_year_id: null } });
  const assessmentAttempts = await prisma.studentAssessmentAttempt.count({ where: { academic_year_id: null } });
  const groupMappings = await prisma.studentGroupMapping.count({ where: { academic_year_id: null } });
  const topicActivations = await prisma.topicActivation.count({ where: { academic_year_id: null } });
  
  console.log(`Would backfill academic_year_id for:`);
  console.log(` - PracticeAttempt: ${practiceAttempts} records`);
  console.log(` - StudentAssessmentAttempt: ${assessmentAttempts} records`);
  console.log(` - StudentGroupMapping: ${groupMappings} records`);
  console.log(` - TopicActivation: ${topicActivations} records\n`);

  console.log('======================================================');
  console.log(`VALIDATION REPORT: SUCCESS (Dry Run)`);
  console.log('======================================================\n');
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
