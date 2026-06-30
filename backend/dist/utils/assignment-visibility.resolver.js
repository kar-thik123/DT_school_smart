"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentVisibilityResolver = void 0;
const academic_context_resolver_1 = require("./academic-context.resolver");
const prisma_1 = __importDefault(require("../prisma"));
class AssignmentVisibilityResolver {
    /**
     * Builds the Prisma 'where' clause for filtering subjects based on a Teacher's assignments.
     * This handles hybrid teachers that may be CLASS_TEACHER (all subjects in section)
     * or SUBJECT_TEACHER (specific subjects in section).
     */
    static async buildTeacherSubjectWhereClause(req) {
        const orgId = req.user.organization_id;
        const teacherId = req.user.user_id;
        const academicYearId = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: {
                teacher_id: teacherId,
                organization_id: orgId,
                academic_year_id: academicYearId
            }
        });
        const inchargeGradeIds = assignments
            .filter((a) => a.assignment_type === 'CLASS_TEACHER' || a.assignment_type === 'CLASS_INCHARGE')
            .map((a) => a.grade_id).filter(Boolean);
        const specificSubjectIds = assignments
            .filter((a) => a.assignment_type === 'SUBJECT_TEACHER')
            .map((a) => a.subject_id).filter(Boolean);
        if (inchargeGradeIds.length === 0 && specificSubjectIds.length === 0) {
            return { id: '00000000-0000-0000-0000-000000000000' };
        }
        return {
            OR: [
                { id: { in: specificSubjectIds } },
                { grade_id: { in: inchargeGradeIds } }
            ]
        };
    }
    /**
     * Builds the Prisma 'where' clause for filtering Sections based on a Teacher's assignments.
     */
    static async buildTeacherSectionWhereClause(req) {
        const orgId = req.user.organization_id;
        const teacherId = req.user.user_id;
        const academicYearId = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: {
                teacher_id: teacherId,
                organization_id: orgId,
                academic_year_id: academicYearId
            },
            select: { section_id: true }
        });
        const sectionIds = assignments.map((a) => a.section_id).filter(Boolean);
        if (sectionIds.length === 0) {
            return { id: '00000000-0000-0000-0000-000000000000' };
        }
        return { id: { in: sectionIds } };
    }
    /**
     * Builds the Prisma 'where' clause for filtering Grades based on a Teacher's assignments.
     */
    static async buildTeacherGradeWhereClause(req) {
        const orgId = req.user.organization_id;
        const teacherId = req.user.user_id;
        const academicYearId = await academic_context_resolver_1.AcademicContextResolver.resolveAcademicYearId(req);
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: {
                teacher_id: teacherId,
                organization_id: orgId,
                academic_year_id: academicYearId
            },
            select: { grade_id: true }
        });
        const gradeIds = assignments.map((a) => a.grade_id).filter(Boolean);
        if (gradeIds.length === 0) {
            return { id: '00000000-0000-0000-0000-000000000000' };
        }
        return { id: { in: gradeIds } };
    }
    /**
     * Retrieves all teacher IDs who have visibility into a specific academic context.
     */
    static async getTeachersForContext(orgId, academicYearId, gradeId, sectionId, subjectId) {
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: {
                organization_id: orgId,
                academic_year_id: academicYearId,
                grade_id: gradeId,
                ...(sectionId ? { section_id: sectionId } : {}),
                OR: [
                    { assignment_type: 'CLASS_TEACHER' },
                    { assignment_type: 'CLASS_INCHARGE' },
                    { assignment_type: 'SUBJECT_TEACHER', subject_id: subjectId }
                ]
            },
            select: { teacher_id: true }
        });
        return Array.from(new Set(assignments.map((a) => a.teacher_id)));
    }
}
exports.AssignmentVisibilityResolver = AssignmentVisibilityResolver;
