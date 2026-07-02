import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.examination.findMany({
    include: {
      academic_year: true,
      organization: true
    }
  });

  console.log(`--- EXAMS FOUND: ${exams.length} ---`);
  exams.forEach(e => {
    console.log(`ID: ${e.id}, Name: ${e.exam_name}, Org: ${e.organization.school_name} (ID: ${e.organization_id}), Year: ${e.academic_year.name} (ID: ${e.academic_year_id})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
