const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const pravinOrg = await prisma.organization.findFirst({
    where: { school_name: 'Pravin' }
  });
  
  if (!pravinOrg) {
    console.log("Pravin org not found");
    return;
  }
  
  const subjects = await prisma.subject.findMany({
    where: { organization_id: pravinOrg.id },
    include: { grade: { include: { academic_year: true } } }
  });
  
  const result = subjects.map(s => ({
    subject_id: s.id,
    subject_name: s.name,
    grade_name: s.grade.name,
    academic_year: s.grade.academic_year.name
  }));
  
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
