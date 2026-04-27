import { PrismaClient } from '@prisma/client';
import { AcademicUnifiedProcessor } from './src/services/bulk-import/processors/academic-unified.processor';

const prisma = new PrismaClient();

async function run() {
  console.log('--- STARTING BULK DEBUG TEST ---');
  
  // 1. Get real context
  const activeYear = await prisma.academicYear.findFirst({ where: { is_active: true }});
  if (!activeYear) return console.log('No active year found.');
  
  // We need the org_id to instantiate processor.
  const organizationId = activeYear.organization_id;
  const userId = 'fake-user-id'; // Not used internally anyway for unified processor

  const processor = new AcademicUnifiedProcessor(organizationId, userId);

  // 2. Resolve relations to init processor internals (like activeAcademicYearId)
  await processor.resolveRelations([]);

  console.log('--- EXECUTING COMMIT ---');
  // 3. Fake a valid row
  const rows = [{
    grade_name: 'Grade 12 (Debug)',
    section_name: 'Alpha',
    subject_name: 'Advanced Physics',
    unit_name: 'Quantum Mechanics',
    topic_name: 'Schrodinger Equation'
  }];

  const result = await processor.commit(rows);
  console.log('\n[Commit Result]:', result, '\n');

  console.log('--- EXTRACTING DB DATA ---');
  // 4. Extract newly created subject
  const subject = await prisma.subject.findFirst({
    where: { name: 'Advanced Physics', organization_id: organizationId },
    include: {
      grade: { select: { academic_year_id: true } },
      subject_groups: {
        include: {
          group: { select: { section_id: true, name: true } }
        }
      }
    }
  });

  console.log(JSON.stringify(subject, null, 2));

  // 5. Explicitly output requested confirmation answers:
  console.log('\n--- CONFIRMATION CHECK ---');
  try {
     const hasSectionId = subject.subject_groups[0]?.group?.section_id;
     console.log(`1. subject_groups.group.section_id exists? -> ${!!hasSectionId} (${hasSectionId})`);
     console.log(`2. organization_id matches logged-in user? -> ${subject.organization_id === organizationId}`);
     console.log(`3. academic_year_id matches active academic year? -> ${subject.grade.academic_year_id === activeYear.id}`);
  } catch (e) {
     console.log('Error verifying requirements: missing subject group linkage properties.');
  }

}

run().catch(console.error).finally(() => prisma.$disconnect());
