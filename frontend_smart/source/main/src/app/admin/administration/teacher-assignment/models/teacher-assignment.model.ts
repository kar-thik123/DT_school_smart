export enum AssignmentType {
  CLASS_TEACHER = 'CLASS_TEACHER',
  SUBJECT_TEACHER = 'SUBJECT_TEACHER'
}

export interface ITeacherAssignment {
  id: string;
  organization_id: string;
  academic_year_id: string;
  teacher_id: string;
  assignment_type: AssignmentType;
  grade_id: string;
  section_id?: string;
  subject_id?: string;
  created_at?: string;

  teacher?: { id: string; name: string; email: string };
  grade?: { id: string; name: string };
  section?: { id: string; name: string };
  subject?: { id: string; name: string };
}

export interface ITeacherAssignmentPayload {
  teacher_id: string;
  academic_year_id: string;
  assignment_type: AssignmentType;
  grade_id: string;
  section_id?: string;
  subject_id?: string;
}

export interface IBatchTeacherAssignmentPayload {
  teacher_id: string;
  academic_year_id: string;
  assignments: {
    assignment_type: AssignmentType;
    grade_id: string;
    section_id?: string;
    subject_id?: string;
  }[];
}
