export interface ReportCardData {
  id: number;
  student_name: string;
  roll_no: string;
  exam_name: string;
  total_marks: number;
  percentage: number;
  grade: string;
  result: string;
}

export class ReportCard implements ReportCardData {
  id: number;
  student_name: string;
  roll_no: string;
  exam_name: string;
  total_marks: number;
  percentage: number;
  grade: string;
  result: string;

  constructor(reportCard: ReportCardData) {
    {
      this.id = reportCard.id || this.generateRandomID();
      this.student_name = reportCard.student_name || '';
      this.roll_no = reportCard.roll_no || '';
      this.exam_name = reportCard.exam_name || '';
      this.total_marks = reportCard.total_marks || 0;
      this.percentage = reportCard.percentage || 0;
      this.grade = reportCard.grade || '';
      this.result = reportCard.result || '';
    }
  }

  private generateRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
