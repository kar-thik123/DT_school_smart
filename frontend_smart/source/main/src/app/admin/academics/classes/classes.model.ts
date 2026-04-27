export class Classes {
  id: number;
  className: string;
  section: string;
  academicYear: string;
  teacher: string;
  status: string;
  studentCount: string;
  roomNumber: string;

  constructor(classes: Classes) {
    {
      this.id = classes.id || 0;
      this.className = classes.className || '';
      this.section = classes.section || '';
      this.academicYear = classes.academicYear || '';
      this.teacher = classes.teacher || '';
      this.status = classes.status || '';
      this.studentCount = classes.studentCount || '';
      this.roomNumber = classes.roomNumber || '';
    }
  }
}
