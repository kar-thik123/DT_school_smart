import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const org_id = '1c9ad3bd-1c01-481e-8276-16ed612f52bc'; // St Michael higher secondary school
  const yearId_active = '182480cb-b0f9-4eb8-af1d-dc19cea211a4'; // 2026-2027 academic year

  console.log('--- CURRICULUM COVERAGE LIVE DB CHECK FOR ALL GRADES ---');

  // Load all active year grades
  const grades = await prisma.grade.findMany({
    where: { organization_id: org_id, academic_year_id: yearId_active },
    orderBy: { sort_order: 'asc' }
  });

  for (const grade of grades) {
    const subjects = await prisma.subject.findMany({
      where: { organization_id: org_id, grade_id: grade.id },
      include: { units: { select: { id: true } } }
    });

    if (subjects.length === 0) continue;

    // Completed Units
    const completions = await prisma.completionTracking.findMany({
      where: {
        organization_id: org_id,
        academic_year_id: yearId_active,
        grade_id: grade.id,
        completion_level: 'UNIT',
        is_completed: true
      },
      select: { unit_id: true }
    });

    const completedUnitIds = new Set(completions.map(c => c.unit_id).filter(Boolean));

    let totalPlannedUnits = 0;
    let totalCompletedUnits = 0;

    for (const sub of subjects) {
      totalPlannedUnits += sub.units.length;
      for (const unit of sub.units) {
        if (completedUnitIds.has(unit.id)) {
          totalCompletedUnits++;
        }
      }
    }

    const progress = totalPlannedUnits > 0 ? Math.round((totalCompletedUnits / totalPlannedUnits) * 100) : 0;
    if (totalCompletedUnits > 0) {
      console.log(`Grade: ${grade.name} (ID: ${grade.id}) -> Completed Units: ${totalCompletedUnits}/${totalPlannedUnits} (${progress}%)`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
