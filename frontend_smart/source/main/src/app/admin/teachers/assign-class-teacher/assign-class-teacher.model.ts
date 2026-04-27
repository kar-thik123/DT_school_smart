import { formatDate } from '@angular/common';

export class AssignClassTeacher {
  id: number;
  teacherId: string;
  teacherName: string;
  img: string;
  classId: string;
  className: string;
  subject: string;
  startDate: string;
  endDate: string;
  assignedBy: string;
  assignmentStatus: string;
  academicYear: string;
  classTiming: string;
  roomNumber: string;

  constructor(assignClassTeacher: Partial<AssignClassTeacher> = {}) {
    this.id = assignClassTeacher.id || this.getRandomID();
    this.teacherId = assignClassTeacher.teacherId || '';
    this.teacherName = assignClassTeacher.teacherName || '';
    this.img = assignClassTeacher.img || 'assets/images/user/new.jpg';
    this.classId = assignClassTeacher.classId || '';
    this.className = assignClassTeacher.className || '';
    this.subject = assignClassTeacher.subject || '';
    this.startDate =
      assignClassTeacher.startDate ||
      formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.endDate =
      assignClassTeacher.endDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.assignedBy = assignClassTeacher.assignedBy || '';
    this.assignmentStatus = assignClassTeacher.assignmentStatus || '';
    this.academicYear = assignClassTeacher.academicYear || '';
    this.classTiming = assignClassTeacher.classTiming || '';
    this.roomNumber = assignClassTeacher.roomNumber || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
