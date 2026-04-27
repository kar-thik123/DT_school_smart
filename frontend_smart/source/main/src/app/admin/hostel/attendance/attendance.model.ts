import { formatDate } from '@angular/common';

export class Attendance {
  id: number;
  img: string;
  student_name: string;
  roll_no: string;
  hostel_name: string;
  room_no: string;
  attendance_date: string;
  status: string; // Present, Absent, Late
  note: string;

  constructor(attendance: Partial<Attendance> = {}) {
    this.id = attendance.id || this.getRandomID();
    this.img = attendance.img || 'assets/images/user/new.jpg';
    this.student_name = attendance.student_name || '';
    this.roll_no = attendance.roll_no || '';
    this.hostel_name = attendance.hostel_name || '';
    this.room_no = attendance.room_no || '';
    this.attendance_date = attendance.attendance_date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.status = attendance.status || 'Present';
    this.note = attendance.note || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
