import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE DIAGNOSTIC ---');
  
  const orgs = await prisma.organization.findMany();
  console.log('Organizations:', orgs.map(o => ({ id: o.id, name: o.school_name, subdomain: o.subdomain })));
  
  for (const org of orgs) {
    console.log(`\n--- Org: ${org.school_name} (${org.id}) ---`);
    
    const years = await prisma.academicYear.findMany({ where: { organization_id: org.id } });
    console.log('Academic Years:', years);
    
    const grades = await prisma.grade.findMany({ where: { organization_id: org.id } });
    console.log('Grades Count:', grades.length);
    console.log('Grades:', grades.map(g => ({ id: g.id, name: g.name, year_id: g.academic_year_id })));
    
    const sections = await prisma.section.findMany({ where: { organization_id: org.id } });
    console.log('Sections Count:', sections.length);
    console.log('Sections:', sections.map(s => ({ id: s.id, name: s.name, grade_id: s.grade_id })));
    
    const subjectGroups = await prisma.subjectGroup.findMany({ where: { organization_id: org.id } });
    console.log('Subject Groups Count:', subjectGroups.length);
    console.log('Subject Groups:', subjectGroups.map(sg => ({ id: sg.id, name: sg.name })));
    
    const students = await prisma.user.findMany({
      where: {
        organization_id: org.id,
        role: { name: 'STUDENT' }
      }
    });
    console.log('Student Users Count:', students.length);
    
    const enrollments = await prisma.studentEnrollment.findMany({ where: { organization_id: org.id } });
    console.log('Enrollments Count:', enrollments.length);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
