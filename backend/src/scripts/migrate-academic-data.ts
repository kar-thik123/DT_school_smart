import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../prisma';

async function main() {
  console.log('Starting silent data migration using raw SQL to bypass TypeScript schema checks...');
  
  // Find all active students with a valid section
  const studentRole = await prisma.role.findFirst({
    where: { name: { in: ['STUDENT', 'Student'] } }
  });

  if (!studentRole) {
    console.error('Student role not found. Aborting.');
    return;
  }

  const students = await prisma.user.findMany({
    where: { 
      role_id: studentRole.id,
      is_active: true,
      section_id: { not: null },
      grade_id: { not: null }
    }
  });

  console.log(`Found ${students.length} active students with defined sections/grades.`);

  let newMappings = 0;

  for (const student of students) {
    if (!student.grade_id) continue;

    const subjects = await prisma.subject.findMany({
      where: { grade_id: student.grade_id, organization_id: student.organization_id }
    });

    for (const subject of subjects) {
      const id = require('crypto').randomUUID();
      
      // Upsert logic in raw sql
      const query = `
        INSERT INTO "student_subject_mapping" 
        ("id", "organization_id", "student_id", "subject_id", "subject_type")
        VALUES 
        (CAST($1 AS UUID), CAST($2 AS UUID), CAST($3 AS UUID), CAST($4 AS UUID), 'MANDATORY')
        ON CONFLICT ("student_id", "subject_id") DO NOTHING;
      `;
      
      const result = await prisma.$executeRawUnsafe(query, id, student.organization_id, student.id, subject.id);
      if (result) newMappings++;
    }
  }

  console.log(`Processed ${newMappings} new student-subject relationships (idempotent).`);
}

main().catch(e => {
  console.error('[Migration Error]', e.message);
  process.exit(1);
});
