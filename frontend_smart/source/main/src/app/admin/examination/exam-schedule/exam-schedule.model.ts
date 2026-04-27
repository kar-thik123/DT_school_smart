export class ExamSchedule {
  id: number;
  exam_type: string;
  course: string;
  semester: string;
  subject: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no: string;

  constructor(examSchedule: ExamSchedule) {
    {
      this.id = examSchedule.id || this.getRandomID();
      this.exam_type = examSchedule.exam_type || '';
      this.course = examSchedule.course || '';
      this.semester = examSchedule.semester || '';
      this.subject = examSchedule.subject || '';
      this.exam_date = examSchedule.exam_date || '';
      this.start_time = examSchedule.start_time || '';
      this.end_time = examSchedule.end_time || '';
      this.room_no = examSchedule.room_no || '';
    }
  }
  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
