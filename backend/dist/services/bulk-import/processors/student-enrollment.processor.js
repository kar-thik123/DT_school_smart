"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentEnrollmentProcessor = void 0;
const prisma_1 = __importDefault(require("../../../prisma"));
const client_1 = require("@prisma/client");
class StudentEnrollmentProcessor {
    organizationId;
    userId;
    resolved = {
        users: {},
        academic_years: {},
        grades: {},
        sections: {},
        subject_groups: {}
    };
    fileUniqueSet = new Set();
    constructor(organizationId, userId) {
        this.organizationId = organizationId;
        this.userId = userId;
    }
    async resolveRelations(rows) {
        const emails = Array.from(new Set(rows.map((r) => r.student_email?.trim().toLowerCase()).filter(Boolean)));
        const [users, academicYears, grades, sections, groups] = await Promise.all([
            prisma_1.default.user.findMany({
                where: {
                    organization_id: this.organizationId,
                    email: { in: emails },
                    role: { permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } } } }
                }
            }),
            prisma_1.default.academicYear.findMany({
                where: { organization_id: this.organizationId }
            }),
            prisma_1.default.grade.findMany({
                where: { organization_id: this.organizationId }
            }),
            prisma_1.default.section.findMany({
                where: { organization_id: this.organizationId }
            }),
            prisma_1.default.subjectGroup.findMany({
                where: { organization_id: this.organizationId }
            }),
        ]);
        this.resolved.users = Object.fromEntries(users.map((u) => [u.email.toLowerCase(), u]));
        this.resolved.academic_years = Object.fromEntries(academicYears.map((ay) => [ay.name.trim().toLowerCase(), ay]));
        this.resolved.grades = Object.fromEntries(grades.map((g) => [g.name.trim().toLowerCase(), g]));
        this.resolved.sections = Object.fromEntries(sections.map((s) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));
        this.resolved.subject_groups = Object.fromEntries(groups.map((g) => [`${g.section_id}_${g.name.trim().toLowerCase()}`, g]));
        return this.resolved;
    }
    async validateRow(row) {
        const email = row.student_email?.trim().toLowerCase();
        const academicYearName = row.academic_year?.trim().toLowerCase();
        const gradeName = row.grade_name?.trim().toLowerCase();
        const sectionName = row.section_name?.trim().toLowerCase();
        const groupName = row.group_name?.trim().toLowerCase();
        const errors = [];
        if (!email)
            errors.push("Missing student_email");
        if (!academicYearName)
            errors.push("Missing academic_year");
        if (!gradeName)
            errors.push("Missing grade_name");
        // Intra-file uniqueness check (a student can only be enrolled once per academic year in the file)
        if (email && academicYearName) {
            const uniqueKey = `${email}_${academicYearName}`;
            if (this.fileUniqueSet.has(uniqueKey)) {
                errors.push(`Duplicate mapping: Student is mapped multiple times in academic year '${row.academic_year}' within this file.`);
            }
            this.fileUniqueSet.add(uniqueKey);
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        const user = this.resolved.users[email];
        if (!user)
            errors.push(`Student with email '${row.student_email}' not found or is not a student.`);
        const academicYear = this.resolved.academic_years[academicYearName];
        if (!academicYear)
            errors.push(`Academic Year '${row.academic_year}' not found.`);
        const grade = this.resolved.grades[gradeName];
        if (!grade)
            errors.push(`Grade '${row.grade_name}' not found.`);
        let section;
        if (grade && sectionName) {
            section = this.resolved.sections[`${grade.id}_${sectionName}`];
            if (!section)
                errors.push(`Section '${row.section_name}' does not exist under Grade '${row.grade_name}'.`);
            // Note: In real setup, we'd also check capacity here, but for bulk it's complex since we add multiple at once.
            // We can rely on the commit phase for strict limits or accept them with warnings.
        }
        let group;
        if (section && groupName) {
            group = this.resolved.subject_groups[`${section.id}_${groupName}`];
            if (!group)
                errors.push(`Subject Group '${row.group_name}' does not exist under Section '${row.section_name}'.`);
        }
        else if (!section && groupName) {
            errors.push(`Cannot assign Subject Group without a valid Section.`);
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        return {
            status: 'VALID',
            data: {
                ...row,
                resolved_student_id: user.id,
                resolved_academic_year_id: academicYear.id,
                resolved_grade_id: grade.id,
                resolved_section_id: section?.id || null,
                resolved_group_id: group?.id || null
            }
        };
    }
    async commit(validRows, conflictResolutions) {
        const result = await prisma_1.default.$transaction(async (tx) => {
            let success = 0;
            let failure = 0;
            for (const row of validRows) {
                if (!row.resolved_student_id || !row.resolved_academic_year_id || !row.resolved_grade_id) {
                    failure++;
                    continue;
                }
                try {
                    await tx.studentEnrollment.upsert({
                        where: {
                            student_id_academic_year_id_organization_id: {
                                student_id: row.resolved_student_id,
                                academic_year_id: row.resolved_academic_year_id,
                                organization_id: this.organizationId
                            }
                        },
                        update: {
                            grade_id: row.resolved_grade_id,
                            section_id: row.resolved_section_id,
                            subject_group_id: row.resolved_group_id,
                            status: client_1.EnrollmentStatus.ACTIVE
                        },
                        create: {
                            organization_id: this.organizationId,
                            student_id: row.resolved_student_id,
                            academic_year_id: row.resolved_academic_year_id,
                            grade_id: row.resolved_grade_id,
                            section_id: row.resolved_section_id,
                            subject_group_id: row.resolved_group_id,
                            status: client_1.EnrollmentStatus.ACTIVE
                        }
                    });
                    await tx.user.update({
                        where: { id: row.resolved_student_id },
                        data: { grade_id: row.resolved_grade_id, section_id: row.resolved_section_id }
                    });
                    success++;
                }
                catch (e) {
                    console.error('[Bulk-StudentEnrollment-Commit] Row failed:', e);
                    failure++;
                }
            }
            return { success, failure };
        });
        return { success_count: result.success, failure_count: result.failure };
    }
}
exports.StudentEnrollmentProcessor = StudentEnrollmentProcessor;
