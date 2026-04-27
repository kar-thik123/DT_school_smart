export class Homework {
  id: number;
  class: string;
  section: string;
  subject: string;
  homeworkTitle: string;
  assignedBy: string;
  homeworkDate: string;
  submissionDate: string;
  evaluationDate: string;
  status: string;
  grade: string | null;
  feedback: string;
  attachments: string;
  lateSubmission: boolean;

  constructor(homework: Partial<Homework>) {
    this.id = homework.id || this.getRandomID();
    this.class = homework.class || '';
    this.section = homework.section || '';
    this.subject = homework.subject || '';
    this.homeworkTitle = homework.homeworkTitle || '';
    this.assignedBy = homework.assignedBy || '';
    this.homeworkDate = homework.homeworkDate || '';
    this.submissionDate = homework.submissionDate || '';
    this.evaluationDate = homework.evaluationDate || '';
    this.status = homework.status || '';
    this.grade = homework.grade || null;
    this.feedback = homework.feedback || '';
    this.attachments = homework.attachments || '';
    this.lateSubmission = homework.lateSubmission || false;
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
