import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org_id = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  const gradeId = 'a9acab2f-fe59-4efd-9067-dbe4d9bc5429'; // Grade 11
  
  // 1. Fetch subjects
  const subjects = await prisma.subject.findMany({
    where: { organization_id: org_id, grade_id: gradeId },
    include: { units: true }
  });

  console.log(`Subjects count for Grade 11: ${subjects.length}`);
  for (const s of subjects) {
    console.log(`- Subject: "${s.name}" (ID: ${s.id})`);
    console.log(`  Units:`, s.units.map(u => ({ id: u.id, name: u.name })));
  }

  // 2. Fetch completion tracking records
  const tracking = await prisma.completionTracking.findMany({
    where: {
      organization_id: org_id,
      grade_id: gradeId,
      completion_level: 'UNIT'
    }
  });

  console.log(`\nCompletion tracking count for Grade 11: ${tracking.length}`);
  for (const t of tracking) {
    console.log(`- Unit ID in tracking: ${t.unit_id}, Subject ID: ${t.subject_id}, is_completed: ${t.is_completed}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
