import { formatDate } from '@angular/common';

export class StudentAttendance {
  id: number;
  img: string;
  rollNo: string;
  sName: string;
  class: string;
  date: string;
  status: string;
  note: string;
  semester: string;
  subject: string;
  attendance_time: string;
  present_count: number;
  absent_count: number;
  reason_for_absence: string;
  approved: boolean;
  timestamp: string;

  constructor(studentAttendance: Partial<StudentAttendance>) {
    this.id = studentAttendance.id || this.getRandomID();
    this.img = studentAttendance.img || 'assets/images/user/new.jpg';
    this.rollNo = studentAttendance.rollNo || '';
    this.sName = studentAttendance.sName || '';
    this.class = studentAttendance.class || '';
    this.date =
      studentAttendance.date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.status = studentAttendance.status || '';
    this.note = studentAttendance.note || '';
    this.semester = studentAttendance.semester || '';
    this.subject = studentAttendance.subject || '';
    this.attendance_time = studentAttendance.attendance_time || '09:00:00';
    this.present_count = studentAttendance.present_count || 0;
    this.absent_count = studentAttendance.absent_count || 0;
    this.reason_for_absence = studentAttendance.reason_for_absence || '';
    this.approved = studentAttendance.approved || false;
    this.timestamp =
      studentAttendance.timestamp ||
      formatDate(new Date(), 'yyyy-MM-ddTHH:mm:ssZ', 'en');
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
