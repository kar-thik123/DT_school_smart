export class EntranceExam {
  id: number;
  exam_name: string;
  exam_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  max_marks: number;
  passing_marks: number;
  status: string;
  description: string;

  constructor(entranceExam: EntranceExam) {
    this.id = entranceExam.id || this.getRandomID();
    this.exam_name = entranceExam.exam_name || '';
    this.exam_code = entranceExam.exam_code || '';
    this.exam_date = entranceExam.exam_date || '';
    this.start_time = entranceExam.start_time || '';
    this.end_time = entranceExam.end_time || '';
    this.venue = entranceExam.venue || '';
    this.max_marks = entranceExam.max_marks || 0;
    this.passing_marks = entranceExam.passing_marks || 0;
    this.status = entranceExam.status || '';
    this.description = entranceExam.description || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
