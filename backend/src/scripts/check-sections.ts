import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgId = '1c9ad3bd-1c01-481e-8276-16ed612f52bc';
  const years = await prisma.academicYear.findMany({ where: { organization_id: orgId } });
  
  for (const year of years) {
    const grades = await prisma.grade.findMany({
      where: { organization_id: orgId, academic_year_id: year.id }
    });
    const gradeIds = grades.map(g => g.id);
    
    const sectionsCount = await prisma.section.count({
      where: {
        organization_id: orgId,
        grade_id: { in: gradeIds }
      }
    });

    console.log(`Year: ${year.name} (ID: ${year.id})`);
    console.log(`  Grades Count: ${grades.length}`);
    console.log(`  Sections (Classes) Count: ${sectionsCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
