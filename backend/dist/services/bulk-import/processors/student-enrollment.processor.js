"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentEnrollmentProcessor = void 0;
const prisma_1 = __importDefault(require("../../../prisma"));
const client_1 = require("@prisma/client");
const student_enrollment_service_1 = require("../../student-enrollment.service");
class StudentEnrollmentProcessor {
    organizationId;
    userId;
    academicYearId;
    resolved = {
        users: {},
        academic_years: {},
        grades: {},
        sections: {},
        subject_groups: {},
        section_capacities: {},
        section_current_counts: {},
        existing_enrollments: {}
    };
    fileUniqueSet = new Set();
    sectionAddedCount = {};
    constructor(organizationId, userId, academicYearId) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.academicYearId = academicYearId;
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
        // For capacity validation in analyze phase
        const sectionIds = sections.map((s) => s.id);
        const counts = await prisma_1.default.studentEnrollment.groupBy({
            by: ['section_id'],
            where: { section_id: { in: sectionIds }, organization_id: this.organizationId, status: client_1.EnrollmentStatus.ACTIVE },
            _count: { student_id: true }
        });
        this.resolved.section_capacities = Object.fromEntries(sections.map((s) => [s.id, s.capacity]));
        this.resolved.section_current_counts = Object.fromEntries(counts.map((c) => [c.section_id, c._count.student_id]));
        // Fetch existing enrollments to avoid double counting capacity delta
        const userIds = users.map((u) => u.id);
        if (userIds.length > 0) {
            const existing = await prisma_1.default.studentEnrollment.findMany({
                where: { student_id: { in: userIds }, academic_year_id: this.academicYearId, organization_id: this.organizationId }
            });
            this.resolved.existing_enrollments = Object.fromEntries(existing.map((e) => [e.student_id, e]));
        }
        this.sectionAddedCount = {}; // Reset
        return this.resolved;
    }
    async validateRow(row) {
        const email = row.student_email?.trim().toLowerCase();
        const gradeName = row.grade_name?.trim().toLowerCase();
        const sectionName = row.section_name?.trim().toLowerCase();
        const groupName = row.group_name?.trim().toLowerCase();
        const errors = [];
        if (!email)
            errors.push("Missing student_email");
        if (!gradeName)
            errors.push("Missing grade_name");
        // Intra-file uniqueness check (a student can only be enrolled once per academic year in the file)
        if (email) {
            const uniqueKey = `${email}_${this.academicYearId}`;
            if (this.fileUniqueSet.has(uniqueKey)) {
                errors.push(`Duplicate mapping: Student is mapped multiple times in this file.`);
            }
            this.fileUniqueSet.add(uniqueKey);
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        const user = this.resolved.users[email];
        if (!user)
            errors.push(`Student with email '${row.student_email}' not found or is not a student.`);
        if (!this.academicYearId)
            errors.push(`Active Academic Year is missing.`);
        const grade = this.resolved.grades[gradeName];
        if (!grade)
            errors.push(`Grade '${row.grade_name}' not found.`);
        let section;
        if (grade && sectionName) {
            section = this.resolved.sections[`${grade.id}_${sectionName}`];
            if (!section)
                errors.push(`Section '${row.section_name}' does not exist under Grade '${row.grade_name}'.`);
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
        // Advanced Validations (Group & Capacity) early in Analyze phase
        if (grade) {
            const groupValidation = await student_enrollment_service_1.StudentEnrollmentService.validateGroupAssignment(this.organizationId, grade.id, section?.id, group?.id);
            if (!groupValidation.allowed) {
                errors.push(groupValidation.message || 'Invalid group assignment');
            }
        }
        if (section && user) {
            const existingEnrollment = this.resolved.existing_enrollments[user.id];
            const isAlreadyInSection = existingEnrollment && existingEnrollment.section_id === section.id;
            if (!isAlreadyInSection) {
                const cap = this.resolved.section_capacities[section.id];
                if (cap) {
                    const current = this.resolved.section_current_counts[section.id] || 0;
                    const addedSoFar = this.sectionAddedCount[section.id] || 0;
                    if (current + addedSoFar + 1 > cap) {
                        errors.push(`Section capacity exceeded (Max: ${cap}, Current: ${current}, Incoming: ${addedSoFar + 1}).`);
                    }
                    else {
                        this.sectionAddedCount[section.id] = addedSoFar + 1;
                    }
                }
            }
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        return {
            status: 'VALID',
            data: {
                ...row,
                resolved_student_id: user.id,
                resolved_academic_year_id: this.academicYearId,
                resolved_grade_id: grade.id,
                resolved_section_id: section?.id || null,
                resolved_group_id: group?.id || null
            }
        };
    }
    async commit(validRows, conflictResolutions) {
        const payloads = validRows.map(row => ({
            student_id: row.resolved_student_id,
            grade_id: row.resolved_grade_id,
            section_id: row.resolved_section_id,
            subject_group_id: row.resolved_group_id,
            status: client_1.EnrollmentStatus.ACTIVE
        }));
        try {
            const result = await student_enrollment_service_1.StudentEnrollmentService.bulkEnrollStudents(this.organizationId, this.academicYearId, payloads);
            return { success_count: result.success, failure_count: result.failure };
        }
        catch (e) {
            console.error('[Bulk-StudentEnrollment-Commit] Batch failed:', e);
            // If the batch fails due to a late capacity throw or transaction error
            return { success_count: 0, failure_count: validRows.length };
        }
    }
}
exports.StudentEnrollmentProcessor = StudentEnrollmentProcessor;
