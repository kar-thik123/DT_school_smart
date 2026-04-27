export interface ReportCard {
  id: number;
  academicYear: string;
  className: string;
  examName: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  result: string;
  downloadUrl: string;
}
