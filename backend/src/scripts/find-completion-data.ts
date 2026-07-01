import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org_id = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  const yearId = '182480cb-b0f9-4eb8-af1d-dc19cea211a4';

  const completions = await prisma.completionTracking.findMany({
    where: {
      organization_id: org_id,
      academic_year_id: yearId,
      completion_level: 'UNIT',
      is_completed: true
    },
    include: {
      grade: true,
      subject: true
    }
  });

  console.log(`--- COMPLETIONS FOUND: ${completions.length} ---`);
  completions.forEach(c => {
    console.log(`Grade: ${c.grade.name} (ID: ${c.grade.id}), Subject: ${c.subject.name}, Unit ID: ${c.unit_id}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
