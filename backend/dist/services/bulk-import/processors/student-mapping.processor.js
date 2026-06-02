"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentMappingProcessor = void 0;
const prisma_1 = __importDefault(require("../../../prisma"));
class StudentMappingProcessor {
    organizationId;
    userId;
    academicYearId;
    resolved = {
        users: {},
        grades: {},
        sections: {},
        groups: {},
        mappings: []
    };
    fileUniqueSet = new Set();
    constructor(organizationId, userId, academicYearId) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.academicYearId = academicYearId;
    }
    async resolveRelations(rows) {
        // Pre-normalize incoming row keys
        const emails = Array.from(new Set(rows.map((r) => r.student_email?.trim().toLowerCase()).filter(Boolean)));
        // Fetch all structural records for this org to allow case-insensitive memory mapping
        const [users, grades, sections, groups] = await Promise.all([
            prisma_1.default.user.findMany({
                where: {
                    organization_id: this.organizationId,
                    email: { in: emails },
                    role: { permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } } } }
                }
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
        // Fast mapping indices using forced lowercase for absolute forgiveness
        this.resolved.users = Object.fromEntries(users.map((u) => [u.email.toLowerCase(), u]));
        this.resolved.grades = Object.fromEntries(grades.map((g) => [g.name.trim().toLowerCase(), g]));
        // Composite mapping for names that might overlap across trees
        this.resolved.sections = Object.fromEntries(sections.map((s) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));
        this.resolved.groups = Object.fromEntries(groups.map((g) => [`${g.section_id}_${g.name.trim().toLowerCase()}`, g]));
        // Query existing mappings for resolved students to handle conflicts
        const studentIds = users.map((u) => u.id);
        if (studentIds.length > 0) {
            this.resolved.mappings = await prisma_1.default.studentGroupMapping.findMany({
                where: {
                    organization_id: this.organizationId,
                    student_id: { in: studentIds }
                },
                include: {
                    group: {
                        include: { grade: true, section: true }
                    }
                }
            });
        }
        else {
            this.resolved.mappings = [];
        }
        return this.resolved;
    }
    async validateRow(row) {
        // 1. Required Fields Validation (Strictly Normalized)
        const rawEmail = row.student_email;
        const rawGrade = row.grade_name;
        const rawSection = row.section_name;
        const rawGroup = row.group_name;
        const email = rawEmail?.trim().toLowerCase();
        const gradeName = rawGrade?.trim().toLowerCase();
        const sectionName = rawSection?.trim().toLowerCase();
        const groupName = rawGroup?.trim().toLowerCase();
        const errors = [];
        if (!email)
            errors.push("Missing student_email");
        if (!gradeName)
            errors.push("Missing grade_name");
        if (!sectionName)
            errors.push("Missing section_name");
        if (!groupName)
            errors.push("Missing group_name");
        // 2. Intra-file uniqueness check
        if (email && sectionName) {
            const uniqueKey = `${email}_${sectionName}`;
            if (this.fileUniqueSet.has(uniqueKey)) {
                errors.push(`Duplicate mapping: Student is mapped multiple times in section '${rawSection}' within this file.`);
            }
            this.fileUniqueSet.add(uniqueKey);
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        // 3. Relational Existence & Consistency Validation
        const user = this.resolved.users[email];
        if (!user)
            errors.push(`Student with email '${rawEmail}' not found or is not a student.`);
        const grade = this.resolved.grades[gradeName];
        if (!grade)
            errors.push(`Grade '${rawGrade}' not found.`);
        let section;
        if (grade) {
            section = this.resolved.sections[`${grade.id}_${sectionName}`];
            // Debug Log as requested
            if (!section) {
                console.log({
                    input: rawSection,
                    normalized: `${grade.id}_${sectionName}`,
                    availableSections: Object.keys(this.resolved.sections)
                });
                errors.push(`Section '${rawSection}' does not exist under Grade '${rawGrade}'.`);
            }
        }
        let group;
        if (section) {
            group = this.resolved.groups[`${section.id}_${groupName}`];
            if (!group)
                errors.push(`Subject Group '${rawGroup}' does not exist under Section '${rawSection}'.`);
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        const existingMapping = this.resolved.mappings.find((m) => m.student_id === user.id && m.group.section_id === section.id);
        if (!existingMapping) {
            // Pass resolved core IDs to the raw data block for ultra-fast Commit phase
            return {
                status: 'VALID',
                data: {
                    ...row,
                    resolved_student_id: user.id,
                    resolved_group_id: group.id
                }
            };
        }
        if (existingMapping.group_id === group.id) {
            return { status: 'DUPLICATE', data: row, errors: ['Already assigned to this group'] };
        }
        return {
            status: 'CONFLICT',
            data: {
                ...row,
                student_id: user.id,
                student_email: email,
                target_group_id: group.id,
                target_group_name: group.name,
                current_mapping_id: existingMapping.id,
                current_group_name: existingMapping.group.name,
                current_section_name: existingMapping.group.section.name,
                current_grade_name: existingMapping.group.grade.name
            }
        };
    }
    async commit(validRows, conflictResolutions) {
        const result = await prisma_1.default.$transaction(async (tx) => {
            let success = 0;
            let failure = 0;
            // Phase 1: Handle conflict resolutions
            if (conflictResolutions && conflictResolutions.length > 0) {
                for (const res of conflictResolutions) {
                    if (res.action === 'MOVE' && res.mapping_id && res.row) {
                        try {
                            // Delete old mapping
                            await tx.studentGroupMapping.delete({
                                where: { id: res.mapping_id }
                            });
                            // Create new mapping
                            await tx.studentGroupMapping.upsert({
                                where: {
                                    student_id_group_id: {
                                        student_id: res.row.student_id,
                                        group_id: res.row.target_group_id
                                    }
                                },
                                update: {},
                                create: {
                                    organization_id: this.organizationId,
                                    student_id: res.row.student_id,
                                    group_id: res.row.target_group_id,
                                    academic_year_id: this.academicYearId
                                }
                            });
                            success++;
                        }
                        catch (e) {
                            console.error('[Bulk-StudentMapping-Commit] Conflict resolution failed:', e);
                            failure++;
                        }
                    }
                    // SKIP actions do nothing
                }
            }
            // Phase 2: Perform discrete isolated upserts across the valid block
            for (const row of validRows) {
                if (!row.resolved_student_id || !row.resolved_group_id) {
                    failure++;
                    continue;
                }
                try {
                    await tx.studentGroupMapping.upsert({
                        where: {
                            student_id_group_id: {
                                student_id: row.resolved_student_id,
                                group_id: row.resolved_group_id
                            }
                        },
                        update: {}, // Idempotent execution
                        create: {
                            organization_id: this.organizationId,
                            student_id: row.resolved_student_id,
                            group_id: row.resolved_group_id,
                            academic_year_id: this.academicYearId
                        }
                    });
                    success++;
                }
                catch (e) {
                    console.error('[Bulk-StudentMapping-Commit] Row failed:', e);
                    failure++;
                }
            }
            return { success, failure };
        });
        return { success_count: result.success, failure_count: result.failure };
    }
}
exports.StudentMappingProcessor = StudentMappingProcessor;
