export interface MarksEntry {
  id: number;
  rollNo: string;
  studentName: string;
  class: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  status: string; // 'Submitted', 'Pending', 'In Progress'
}
