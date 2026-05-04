"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting migration to StudentEnrollment...');
    // Get all active academic years for all organizations
    const activeYears = await prisma.academicYear.findMany({
        where: { is_active: true }
    });
    const orgYearMap = new Map();
    for (const year of activeYears) {
        orgYearMap.set(year.organization_id, year.id);
    }
    // Get all users who are students and have a grade
    const students = await prisma.user.findMany({
        where: {
            role: { name: 'STUDENT' },
            grade_id: { not: null }
        }
    });
    console.log(`Found ${students.length} students to migrate.`);
    let createdCount = 0;
    let skippedCount = 0;
    for (const student of students) {
        if (!student.grade_id)
            continue;
        let academic_year_id = orgYearMap.get(student.organization_id);
        // If no active year, try to find any year, or we can't migrate safely
        if (!academic_year_id) {
            const anyYear = await prisma.academicYear.findFirst({
                where: { organization_id: student.organization_id }
            });
            if (anyYear) {
                academic_year_id = anyYear.id;
                orgYearMap.set(student.organization_id, academic_year_id);
            }
            else {
                console.warn(`No academic year found for org ${student.organization_id}, skipping student ${student.email}`);
                skippedCount++;
                continue;
            }
        }
        try {
            await prisma.studentEnrollment.upsert({
                where: {
                    student_id_academic_year_id_organization_id: {
                        student_id: student.id,
                        academic_year_id,
                        organization_id: student.organization_id
                    }
                },
                update: {
                    grade_id: student.grade_id,
                    section_id: student.section_id
                },
                create: {
                    organization_id: student.organization_id,
                    student_id: student.id,
                    academic_year_id,
                    grade_id: student.grade_id,
                    section_id: student.section_id,
                    status: client_1.EnrollmentStatus.ACTIVE
                }
            });
            createdCount++;
        }
        catch (err) {
            console.error(`Failed to migrate student ${student.email}:`, err.message);
            skippedCount++;
        }
    }
    console.log(`Migration complete. Processed: ${createdCount}, Skipped: ${skippedCount}`);
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
