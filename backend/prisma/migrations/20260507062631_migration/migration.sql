-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('DRAFT', 'PROVISIONING', 'ACTIVE', 'MAINTENANCE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'GRACE_PERIOD');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PROMOTED', 'TRANSFERRED', 'WITHDRAWN', 'GRADUATED', 'ALUMNI');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('CLASS_TEACHER', 'SUBJECT_TEACHER');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO', 'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING', 'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK', 'STRUCTURED_5MARK', 'LONG_ANSWER');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('MANDATORY', 'OPTIONAL', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('DRAFT', 'SENT');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "school_name" TEXT NOT NULL,
    "school_type" TEXT,
    "medium" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "logo_url" TEXT,
    "domain_type" TEXT NOT NULL DEFAULT 'subdomain',
    "subdomain" TEXT,
    "custom_domain" TEXT,
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "smtp_email" TEXT,
    "smtp_password" TEXT,
    "backup_enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'DRAFT',
    "login_limit" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_licenses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "licensed_seats" INTEGER NOT NULL DEFAULT 100,
    "renewal_date" TIMESTAMP(3),
    "grace_period_days" INTEGER NOT NULL DEFAULT 7,
    "warning_threshold" INTEGER NOT NULL DEFAULT 80,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "grade_id" UUID,
    "section_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "admission_number" TEXT,
    "mobile_number" TEXT,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organization_id" UUID,
    "is_system" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "boards" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mediums" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "mediums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "organization_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "grade_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER,
    "warning_threshold" INTEGER,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "grade_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabuses" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "board_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "description" TEXT,

    CONSTRAINT "syllabuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subject_id" UUID,
    "syllabus_id" UUID,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "assignment_type" "AssignmentType" NOT NULL,
    "grade_id" UUID NOT NULL,
    "section_id" UUID,
    "subject_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MCQ_SINGLE',
    "answer" TEXT,
    "answer_config" JSONB NOT NULL DEFAULT '{}',
    "marks" INTEGER NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "is_important" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_activations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "subject_group_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_attempts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "correct_answers" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "practice_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_groups" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "grade_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_group_subjects" (
    "group_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "subject_type" "SubjectType" NOT NULL DEFAULT 'MANDATORY',

    CONSTRAINT "subject_group_subjects_pkey" PRIMARY KEY ("group_id","subject_id")
);

-- CreateTable
CREATE TABLE "student_group_mapping" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_group_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "section_id" UUID,
    "subject_group_id" UUID,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrollment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_history" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "from_academic_year_id" UUID NOT NULL,
    "to_academic_year_id" UUID NOT NULL,
    "from_grade_id" UUID NOT NULL,
    "to_grade_id" UUID NOT NULL,
    "promoted_by" UUID NOT NULL,
    "promotion_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_mails" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "MailStatus" NOT NULL DEFAULT 'DRAFT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "deletedBySender" BOOLEAN NOT NULL DEFAULT false,
    "deletedByReceiver" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_mails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_subdomain_key" ON "organizations"("subdomain");

-- CreateIndex
CREATE INDEX "organizations_subdomain_idx" ON "organizations"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "organization_licenses_organization_id_key" ON "organization_licenses"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_organization_id_admission_number_key" ON "student_profiles"("organization_id", "admission_number");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "roles_organization_id_idx" ON "roles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_organization_id_key" ON "roles"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "boards_name_organization_id_key" ON "boards"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "mediums_name_organization_id_key" ON "mediums"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_types_name_organization_id_key" ON "organization_types"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_organization_id_key" ON "academic_years"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "grades_name_academic_year_id_organization_id_key" ON "grades"("name", "academic_year_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "sections_name_grade_id_organization_id_key" ON "sections"("name", "grade_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_grade_id_organization_id_key" ON "subjects"("name", "grade_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "syllabuses_subject_id_board_id_organization_id_key" ON "syllabuses"("subject_id", "board_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_teacher_id_assignment_type_grade_id_sec_key" ON "teacher_assignments"("teacher_id", "assignment_type", "grade_id", "section_id", "subject_id", "academic_year_id", "organization_id");

-- CreateIndex
CREATE INDEX "questions_subject_id_unit_id_topic_id_idx" ON "questions"("subject_id", "unit_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "topic_activations_topic_id_subject_group_id_organization_id_key" ON "topic_activations"("topic_id", "subject_group_id", "organization_id");

-- CreateIndex
CREATE INDEX "subject_groups_organization_id_idx" ON "subject_groups"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_groups_name_grade_id_section_id_organization_id_key" ON "subject_groups"("name", "grade_id", "section_id", "organization_id");

-- CreateIndex
CREATE INDEX "student_group_mapping_organization_id_idx" ON "student_group_mapping"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_group_mapping_student_id_group_id_key" ON "student_group_mapping"("student_id", "group_id");

-- CreateIndex
CREATE INDEX "student_enrollments_organization_id_idx" ON "student_enrollments"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_student_id_academic_year_id_organizatio_key" ON "student_enrollments"("student_id", "academic_year_id", "organization_id");

-- CreateIndex
CREATE INDEX "promotion_history_organization_id_idx" ON "promotion_history"("organization_id");

-- CreateIndex
CREATE INDEX "internal_mails_organization_id_idx" ON "internal_mails"("organization_id");

-- CreateIndex
CREATE INDEX "internal_mails_senderId_idx" ON "internal_mails"("senderId");

-- CreateIndex
CREATE INDEX "internal_mails_receiverId_idx" ON "internal_mails"("receiverId");

-- AddForeignKey
ALTER TABLE "organization_licenses" ADD CONSTRAINT "organization_licenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mediums" ADD CONSTRAINT "mediums_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_types" ADD CONSTRAINT "organization_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabuses" ADD CONSTRAINT "syllabuses_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabuses" ADD CONSTRAINT "syllabuses_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabuses" ADD CONSTRAINT "syllabuses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_syllabus_id_fkey" FOREIGN KEY ("syllabus_id") REFERENCES "syllabuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_activations" ADD CONSTRAINT "topic_activations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_activations" ADD CONSTRAINT "topic_activations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_activations" ADD CONSTRAINT "topic_activations_subject_group_id_fkey" FOREIGN KEY ("subject_group_id") REFERENCES "subject_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_answers" ADD CONSTRAINT "practice_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "practice_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_answers" ADD CONSTRAINT "practice_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "subject_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group_mapping" ADD CONSTRAINT "student_group_mapping_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group_mapping" ADD CONSTRAINT "student_group_mapping_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_group_mapping" ADD CONSTRAINT "student_group_mapping_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "subject_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_subject_group_id_fkey" FOREIGN KEY ("subject_group_id") REFERENCES "subject_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_promoted_by_fkey" FOREIGN KEY ("promoted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_from_academic_year_id_fkey" FOREIGN KEY ("from_academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_to_academic_year_id_fkey" FOREIGN KEY ("to_academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_from_grade_id_fkey" FOREIGN KEY ("from_grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_to_grade_id_fkey" FOREIGN KEY ("to_grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_mails" ADD CONSTRAINT "internal_mails_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_mails" ADD CONSTRAINT "internal_mails_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_mails" ADD CONSTRAINT "internal_mails_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
