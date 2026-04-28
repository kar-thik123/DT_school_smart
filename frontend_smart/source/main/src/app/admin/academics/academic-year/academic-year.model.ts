export class AcademicYear {
  id: string | number;
  academicYear: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  department: string;

  constructor(academicYear: any) {
    this.id = academicYear.id || 0;
    this.academicYear = academicYear.academicYear || '';
    this.status = academicYear.status || '';
    this.startDate = academicYear.startDate || '';
    this.endDate = academicYear.endDate || '';
    this.description = academicYear.description || '';
    this.department = academicYear.department || '';
  }
}
