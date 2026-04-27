export interface IAttendanceReport {
  id: number;
  img: string;
  reportType: string;
  className: string;
  dateFrom: string;
  dateTo: string;
  attendancePercentage: number;
  generatedBy: string;
  date: string;
  status: string;
}

export class AttendanceReport implements IAttendanceReport {
  id: number;
  img: string;
  reportType: string;
  className: string;
  dateFrom: string;
  dateTo: string;
  attendancePercentage: number;
  generatedBy: string;
  date: string;
  status: string;

  constructor(report: Partial<AttendanceReport>) {
    this.id = report.id || this.getRandomID();
    this.img = report.img || 'assets/images/user/new.jpg';
    this.reportType = report.reportType || '';
    this.className = report.className || '';
    this.dateFrom = report.dateFrom || '';
    this.dateTo = report.dateTo || '';
    this.attendancePercentage = report.attendancePercentage || 0;
    this.generatedBy = report.generatedBy || '';
    this.date = report.date || '';
    this.status = report.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
