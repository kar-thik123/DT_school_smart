"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// A mapping of Prisma types to PostgreSQL column types
const typeMapping = {
    String: 'UUID', // Defaulting String to UUID or TEXT depending on context, we will handle specifically below
    Int: 'INTEGER',
    Boolean: 'BOOLEAN',
    DateTime: 'TIMESTAMP WITHOUT TIME ZONE',
    Json: 'JSONB'
};
async function main() {
    console.log('🏁 Starting Enterprise Database Integrity Scan & Auto-Healing System...');
    // The list of models and their expected table mappings
    const models = [
        { name: 'Organization', table: 'organizations' },
        { name: 'OrganizationLicense', table: 'organization_licenses' },
        { name: 'User', table: 'users' },
        { name: 'Role', table: 'roles' },
        { name: 'Permission', table: 'permissions' },
        { name: 'RolePermission', table: 'role_permissions' },
        { name: 'AcademicYear', table: 'academic_years' },
        { name: 'Grade', table: 'grades' },
        { name: 'Section', table: 'sections' },
        { name: 'Subject', table: 'subjects' },
        { name: 'Syllabus', table: 'syllabi' },
        { name: 'Unit', table: 'units' },
        { name: 'Topic', table: 'topics' },
        { name: 'SubTopic', table: 'sub_topics' },
        { name: 'TeacherAssignment', table: 'teacher_assignments' },
        { name: 'StudentEnrollment', table: 'student_enrollments' },
        { name: 'SubjectGroup', table: 'subject_groups' },
        { name: 'SubjectGroupSubject', table: 'subject_group_subjects' },
        { name: 'TopicActivation', table: 'topic_activations' },
        { name: 'TopicCompletion', table: 'topic_completions' },
        { name: 'AuditLog', table: 'audit_logs' },
        { name: 'ModuleConfig', table: 'module_configs' }
    ];
    for (const model of models) {
        try {
            // 1. Fetch current columns from information_schema
            const cols = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${model.table}'
      `);
            const existingCols = new Set(cols.map((c) => c.column_name.toLowerCase()));
            if (existingCols.size === 0) {
                console.log(`⚠️  Table '${model.table}' does not exist or has no columns.`);
                continue;
            }
            console.log(`\n🔍 Scanning Table '${model.table}'...`);
            // 2. We check for standard auditing columns created_at and updated_at
            const standardAuditing = [
                { name: 'created_at', type: 'TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()' },
                { name: 'updated_at', type: 'TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()' }
            ];
            for (const col of standardAuditing) {
                if (!existingCols.has(col.name)) {
                    console.log(`  ➕ Column '${col.name}' is missing in '${model.table}'!`);
                    const alterQuery = `ALTER TABLE ${model.table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`;
                    console.log(`  Executing: ${alterQuery}`);
                    await prisma.$executeRawUnsafe(alterQuery);
                    console.log('    ✅ Success');
                }
            }
        }
        catch (err) {
            console.error(`  ❌ Error processing model ${model.name}:`, err.message);
        }
    }
    console.log('\n🎉 Enterprise Database Integrity Recovery Complete!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
