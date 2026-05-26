"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStudentSectionAccess = exports.checkTeacherSubjectAccess = exports.isNewAcademicStructureEnabled = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const isNewAcademicStructureEnabled = () => {
    return process.env.USE_NEW_ACADEMIC_STRUCTURE === 'true';
};
exports.isNewAcademicStructureEnabled = isNewAcademicStructureEnabled;
/**
 * Checks if a teacher has access to a subject.
 * Integrates dual-read logic while maintaining backwards compatibility.
 */
const checkTeacherSubjectAccess = async (teacher_id, subject_id, org_id) => {
    // Use findFirst (not findUnique) because compound { id, organization_id } is not a unique constraint in the schema.
    const subject = await prisma_1.default.subject.findFirst({ where: { id: subject_id, organization_id: org_id } });
    if (!subject)
        return false;
    // Check traditional Teacher Assignments
    const assignment = await prisma_1.default.teacherAssignment.findFirst({
        where: {
            teacher_id,
            organization_id: org_id,
            OR: [
                { subject_id }, // Direct subject assignment
                { assignment_type: 'CLASS_TEACHER', grade_id: subject.grade_id } // Class teacher has access to all subjects in their grade
            ]
        }
    });
    if (assignment)
        return true;
    return false;
};
exports.checkTeacherSubjectAccess = checkTeacherSubjectAccess;
/**
 * Validates a student's access to a section/subject.
 * Auto-corrects missing section IDs for legacy logic.
 */
const validateStudentSectionAccess = async (student_id, org_id) => {
    const student = await prisma_1.default.user.findFirst({
        where: { id: student_id, organization_id: org_id }
    });
    if (!student)
        return { section_id: null, error: 'Student not found' };
    if (!student.section_id) {
        if (student.grade_id) {
            const firstSection = await prisma_1.default.section.findFirst({ where: { grade_id: student.grade_id } });
            if (firstSection) {
                await prisma_1.default.user.update({ where: { id: student.id }, data: { section_id: firstSection.id } });
                return { section_id: firstSection.id };
            }
        }
        return { section_id: null, error: 'Student is not assigned to any section' };
    }
    return { section_id: student.section_id };
};
exports.validateStudentSectionAccess = validateStudentSectionAccess;
