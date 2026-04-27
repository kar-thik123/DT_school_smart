export class Lectures {
  id: string;
  subjectName: string;
  class: string;
  date: string;
  time: string;
  status: string;
  teacher_id: string;
  subject_id: string;
  student_group: string;
  duration: number;
  location: string;
  attendance_count: number;
  created_at: string;
  updated_at: string;
  reason_for_cancellation: string;

  constructor(lectures: Partial<Lectures>) {
    // Use Partial to allow optional properties
    this.id = lectures.id || this.getRandomID();
    this.subjectName = lectures.subjectName || '';
    this.class = lectures.class || '';
    this.date = lectures.date || '';
    this.time = lectures.time || '';
    this.status = lectures.status || '';
    this.teacher_id = lectures.teacher_id || '';
    this.subject_id = lectures.subject_id || '';
    this.student_group = lectures.student_group || '';
    this.duration = lectures.duration || 60; // Default value
    this.location = lectures.location || '';
    this.attendance_count = lectures.attendance_count || 0; // Default value
    this.created_at = lectures.created_at || new Date().toISOString(); // Default to current date
    this.updated_at = lectures.updated_at || new Date().toISOString(); // Default to current date
    this.reason_for_cancellation = lectures.reason_for_cancellation || '';
  }

  public getRandomID(): string {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4().toString() + S4().toString();
  }
}
