export interface IExamReport {
  id: number;
  img: string;
  examName: string;
  className: string;
  subject: string;
  examDate: string;
  passPercentage: number;
  averageMarks: number;
  generatedBy: string;
  date: string;
  status: string;
}

export class ExamReport implements IExamReport {
  id: number;
  img: string;
  examName: string;
  className: string;
  subject: string;
  examDate: string;
  passPercentage: number;
  averageMarks: number;
  generatedBy: string;
  date: string;
  status: string;

  constructor(report: Partial<ExamReport>) {
    this.id = report.id || this.getRandomID();
    this.img = report.img || 'assets/images/user/new.jpg';
    this.examName = report.examName || '';
    this.className = report.className || '';
    this.subject = report.subject || '';
    this.examDate = report.examDate || '';
    this.passPercentage = report.passPercentage || 0;
    this.averageMarks = report.averageMarks || 0;
    this.generatedBy = report.generatedBy || '';
    this.date = report.date || '';
    this.status = report.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
