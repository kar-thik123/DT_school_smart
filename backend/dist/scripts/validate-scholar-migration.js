"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const student_mapping_processor_1 = require("../services/bulk-import/processors/student-mapping.processor");
const student_enrollment_processor_1 = require("../services/bulk-import/processors/student-enrollment.processor");
const teacher_assignment_processor_1 = require("../services/bulk-import/processors/teacher-assignment.processor");
const prisma = new client_1.PrismaClient();
async function runTests() {
    console.log('--- Starting Scholar Validation ---');
    // 1. Get Organization and Permissions
    const org = await prisma.organization.findFirst();
    if (!org)
        throw new Error('No organization found');
    const studentPerm = await prisma.permission.findUnique({
        where: { module_action: { module: 'IDENTITY', action: 'IS_STUDENT' } }
    });
    if (!studentPerm)
        throw new Error('IDENTITY:IS_STUDENT not found');
    // 2. Create Scholar Role
    let scholarRole = await prisma.role.findFirst({ where: { name: 'Scholar', organization_id: org.id } });
    if (!scholarRole) {
        scholarRole = await prisma.role.create({
            data: {
                name: 'Scholar',
                description: 'A custom student role',
                organization_id: org.id,
                is_system: false
            }
        });
        await prisma.rolePermission.create({
            data: {
                role_id: scholarRole.id,
                permission_id: studentPerm.id
            }
        });
        console.log('Created Scholar role with IDENTITY:IS_STUDENT');
    }
    // 3. Create User with role_id (testing Phase A creation logic bypass)
    const userEmail = `scholar_${Date.now()}@test.com`;
    const user = await prisma.user.create({
        data: {
            name: 'Test Scholar',
            email: userEmail,
            password_hash: 'hashed',
            role_id: scholarRole.id,
            organization_id: org.id
        }
    });
    console.log('Created user with Scholar role_id. User ID:', user.id);
    // 4. Test Bulk Import Student Mapping Processor (Phase B)
    const mappingProcessor = new student_mapping_processor_1.StudentMappingProcessor(org.id, 'test_user');
    const mockMappingRows = [{
            student_email: userEmail,
            grade_name: 'Grade 10', // Assuming exists, but we only care about role resolution
            section_name: 'A',
            group_name: 'Science'
        }];
    const resolvedMappings = await mappingProcessor.resolveRelations(mockMappingRows);
    const resolvedUserMapping = resolvedMappings.users[userEmail.toLowerCase()];
    if (resolvedUserMapping) {
        console.log('SUCCESS: StudentMappingProcessor resolved the Scholar user!');
    }
    else {
        console.error('FAIL: StudentMappingProcessor failed to resolve the Scholar user.');
    }
    // 5. Test Bulk Import Student Enrollment Processor (Phase B)
    const enrollmentProcessor = new student_enrollment_processor_1.StudentEnrollmentProcessor(org.id, 'test_user');
    const mockEnrollmentRows = [{
            student_email: userEmail,
            academic_year: '2025',
            grade_name: 'Grade 10',
            section_name: 'A',
            group_name: 'Science'
        }];
    const resolvedEnrollments = await enrollmentProcessor.resolveRelations(mockEnrollmentRows);
    const resolvedUserEnrollment = resolvedEnrollments.users[userEmail.toLowerCase()];
    if (resolvedUserEnrollment) {
        console.log('SUCCESS: StudentEnrollmentProcessor resolved the Scholar user!');
    }
    else {
        console.error('FAIL: StudentEnrollmentProcessor failed to resolve the Scholar user.');
    }
    // 6. Test Teacher Assignment Processor (Negative Test)
    const teacherProcessor = new teacher_assignment_processor_1.TeacherAssignmentProcessor(org.id, 'test_user');
    const mockTeacherRows = [{
            teacher_email: userEmail,
            assignment_type: 'CLASS_INCHARGE',
            grade_name: 'Grade 10',
            section_name: 'A'
        }];
    const resolvedTeachers = await teacherProcessor.resolveRelations(mockTeacherRows);
    const resolvedUserTeacher = resolvedTeachers.teachers[userEmail.toLowerCase()];
    if (!resolvedUserTeacher) {
        console.log('SUCCESS: TeacherAssignmentProcessor correctly ignored the Scholar user!');
    }
    else {
        console.error('FAIL: TeacherAssignmentProcessor incorrectly resolved the Scholar user as a teacher.');
    }
    console.log('--- Validation Complete ---');
}
runTests()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
