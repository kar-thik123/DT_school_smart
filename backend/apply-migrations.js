const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  const statements = [
    `DO $$ BEGIN CREATE TYPE "SubjectType" AS ENUM ('MANDATORY', 'OPTIONAL', 'ELECTIVE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    
    `CREATE TABLE IF NOT EXISTS "subject_groups" (
      "id" UUID NOT NULL,
      "organization_id" UUID NOT NULL,
      "name" TEXT NOT NULL,
      "grade_id" UUID NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "subject_groups_pkey" PRIMARY KEY ("id")
    );`,
    
    `CREATE TABLE IF NOT EXISTS "subject_group_subjects" (
      "group_id" UUID NOT NULL,
      "subject_id" UUID NOT NULL,
      "subject_type" "SubjectType" NOT NULL DEFAULT 'MANDATORY',
      CONSTRAINT "subject_group_subjects_pkey" PRIMARY KEY ("group_id","subject_id")
    );`,
    
    `CREATE TABLE IF NOT EXISTS "student_subject_mapping" (
      "id" UUID NOT NULL,
      "organization_id" UUID NOT NULL,
      "student_id" UUID NOT NULL,
      "subject_id" UUID NOT NULL,
      "subject_type" "SubjectType" NOT NULL DEFAULT 'MANDATORY',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "student_subject_mapping_pkey" PRIMARY KEY ("id")
    );`,
    
    `CREATE TABLE IF NOT EXISTS "academic_blocks" (
      "id" UUID NOT NULL,
      "organization_id" UUID NOT NULL,
      "name" TEXT NOT NULL,
      "grade_id" UUID NOT NULL,
      "subject_id" UUID,
      "group_id" UUID,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "academic_blocks_pkey" PRIMARY KEY ("id")
    );`,
    
    `CREATE TABLE IF NOT EXISTS "teacher_academic_blocks" (
      "teacher_id" UUID NOT NULL,
      "block_id" UUID NOT NULL,
      CONSTRAINT "teacher_academic_blocks_pkey" PRIMARY KEY ("teacher_id","block_id")
    );`
  ];

  for (const s of statements) {
    try {
      await prisma.$executeRawUnsafe(s);
      console.log('Success:', s.substring(0, 50) + '...');
    } catch (e) {
      console.error('Error on statement:', s.substring(0, 50) + '...', e.message);
    }
  }

  // Relations and indices
  const alters = [
    `CREATE INDEX IF NOT EXISTS "subject_groups_organization_id_idx" ON "subject_groups"("organization_id");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "subject_groups_name_grade_id_organization_id_key" ON "subject_groups"("name", "grade_id", "organization_id");`,
    `CREATE INDEX IF NOT EXISTS "student_subject_mapping_organization_id_idx" ON "student_subject_mapping"("organization_id");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "student_subject_mapping_student_id_subject_id_key" ON "student_subject_mapping"("student_id", "subject_id");`,
    `CREATE INDEX IF NOT EXISTS "academic_blocks_organization_id_idx" ON "academic_blocks"("organization_id");`,

    `ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "subject_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "student_subject_mapping" ADD CONSTRAINT "student_subject_mapping_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "student_subject_mapping" ADD CONSTRAINT "student_subject_mapping_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "student_subject_mapping" ADD CONSTRAINT "student_subject_mapping_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "academic_blocks" ADD CONSTRAINT "academic_blocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "academic_blocks" ADD CONSTRAINT "academic_blocks_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "academic_blocks" ADD CONSTRAINT "academic_blocks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "academic_blocks" ADD CONSTRAINT "academic_blocks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "subject_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "teacher_academic_blocks" ADD CONSTRAINT "teacher_academic_blocks_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    `ALTER TABLE "teacher_academic_blocks" ADD CONSTRAINT "teacher_academic_blocks_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "academic_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
  ];

  for (const a of alters) {
    try {
      await prisma.$executeRawUnsafe(a);
      console.log('Success:', a.substring(0, 50) + '...');
    } catch (e) {
      // Ignore if already exists, but log it
      console.log('Failed/Ignored:', a.substring(0, 50) + '...', e.message);
    }
  }

  await prisma.$disconnect();
  console.log("Migration script complete.");
}

main().catch(e => { console.error(e.message); process.exit(1); });
