export class ExamType {
  id: number;
  exam_name: string;
  exam_code: string;
  description: string;
  status: string;

  constructor(examType: ExamType) {
    {
      this.id = examType.id || this.getRandomID();
      this.exam_name = examType.exam_name || '';
      this.exam_code = examType.exam_code || '';
      this.description = examType.description || '';
      this.status = examType.status || '';
    }
  }
  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
