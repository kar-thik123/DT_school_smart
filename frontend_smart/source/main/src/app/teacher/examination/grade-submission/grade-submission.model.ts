export interface GradeSubmission {
  id: number;
  rollNo: string;
  studentName: string;
  averageMarks: number;
  grade: string;
  status: string; // 'Submitted', 'Draft', 'Not Started'
  submissionDate: string;
}
