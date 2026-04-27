import { formatDate } from '@angular/common';

export class ClassList {
  classId: number;
  className: string;
  classCode: string;
  teacherId: number;
  startDate: string;
  endDate: string;
  roomNumber: string;
  schedule: string;
  semester: string;
  classCapacity: number;
  status: string;
  description: string;
  classType: string;
  createdAt: string;
  updatedAt: string;

  constructor(classData: Partial<ClassList> = {}) {
    this.classId = classData.classId || this.generateClassId();
    this.className = classData.className || '';
    this.classCode = classData.classCode || '';
    this.teacherId = classData.teacherId || 0;
    this.startDate =
      classData.startDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.endDate =
      classData.endDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.roomNumber = classData.roomNumber || '';
    this.schedule = classData.schedule || 'Not Scheduled';
    this.semester = classData.semester || '';
    this.classCapacity = classData.classCapacity || 0;
    this.status = classData.status || 'Inactive';
    this.description = classData.description || 'No description available.';
    this.classType = classData.classType || 'Regular';
    this.createdAt =
      classData.createdAt || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.updatedAt =
      classData.updatedAt || formatDate(new Date(), 'yyyy-MM-dd', 'en');
  }

  private generateClassId(): number {
    return Math.floor(Math.random() * 10000) + 1; // Generate a random class ID
  }
}
