export class MarksEntry {
  id: number;
  exam_name: string;
  student_name: string;
  roll_no: string;
  subject: string;
  marks_obtained: number;
  max_marks: number;
  status: string;

  constructor(marksEntry: MarksEntry) {
    {
      this.id = marksEntry.id || this.getRandomID();
      this.exam_name = marksEntry.exam_name || '';
      this.student_name = marksEntry.student_name || '';
      this.roll_no = marksEntry.roll_no || '';
      this.subject = marksEntry.subject || '';
      this.marks_obtained = marksEntry.marks_obtained || 0;
      this.max_marks = marksEntry.max_marks || 100;
      this.status = marksEntry.status || '';
    }
  }
  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
