const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const grades = await prisma.grade.findMany({ where: { name: '11' } });
  console.log('Grades:', grades.map(g => ({ id: g.id, name: g.name, academic_year_id: g.academic_year_id })));
  
  if (grades.length > 0) {
     const gradeIds = grades.map(g => g.id);
     const subjects = await prisma.subject.findMany({ where: { grade_id: { in: gradeIds } } });
     console.log('Subjects for Grade 11:', subjects.map(s => ({ id: s.id, name: s.name, grade_id: s.grade_id })));
     
     const units = await prisma.unit.findMany({ where: { grade_id: { in: gradeIds } } });
     console.log('Units for Grade 11:', units.map(u => ({ id: u.id, name: u.name, subject_id: u.subject_id })));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
