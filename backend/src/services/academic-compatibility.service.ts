import prisma from '../prisma';

export const isNewAcademicStructureEnabled = () => {
  return process.env.USE_NEW_ACADEMIC_STRUCTURE === 'true';
};

/**
 * Checks if a teacher has access to a subject.
 * Integrates dual-read logic while maintaining backwards compatibility.
 */
export const checkTeacherSubjectAccess = async (teacher_id: string, subject_id: string, org_id: string): Promise<boolean> => {
  // Use findFirst (not findUnique) because compound { id, organization_id } is not a unique constraint in the schema.
  const subject = await prisma.subject.findFirst({ where: { id: subject_id, organization_id: org_id } });
  if (!subject) return false;

  // Check traditional Teacher Assignments
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacher_id,
      organization_id: org_id,
      OR: [
        { subject_id },                                              // Direct subject assignment
        { assignment_type: 'CLASS_TEACHER', grade_id: subject.grade_id } // Class teacher has access to all subjects in their grade
      ]
    }
  });

  if (assignment) return true;


  return false;
};

/**
 * Validates a student's access to a section/subject.
 * Auto-corrects missing section IDs for legacy logic.
 */
export const validateStudentSectionAccess = async (student_id: string, org_id: string): Promise<{ section_id: string | null; error?: string }> => {
  const student = await prisma.user.findFirst({
    where: { id: student_id, organization_id: org_id }
  });

  if (!student) return { section_id: null, error: 'Student not found' };

  if (!student.section_id) {
    if (student.grade_id) {
      const firstSection = await prisma.section.findFirst({ where: { grade_id: student.grade_id } });
      if (firstSection) {
        await prisma.user.update({ where: { id: student.id }, data: { section_id: firstSection.id } });
        return { section_id: firstSection.id };
      }
    }
    return { section_id: null, error: 'Student is not assigned to any section' };
  }

  return { section_id: student.section_id };
};
