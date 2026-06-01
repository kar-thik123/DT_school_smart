const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const orgs = await prisma.organization.findMany({
    include: { academic_years: true }
  });
  
  const result = orgs.map(o => ({
    name: o.school_name,
    subdomain: o.subdomain,
    academicYears: o.academic_years.length,
    activeYears: o.academic_years.filter(y => y.is_active).length,
    years: o.academic_years.map(y => ({ name: y.name, isActive: y.is_active }))
  }));
  
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
