export class StaffAttendance {
  id: number;
  img: string;
  name: string;
  employee_id: string;
  designation: string;
  date: string;
  check_in: string;
  break: string;
  check_out: string;
  total: string;
  shift: string;
  late_arrival: string;
  early_departure: string;
  absence_reason: string;
  overtime: string;
  total_breaks: string;
  remarks: string;
  attendance_status: string;
  department: string;

  constructor(staffAttendance: Partial<StaffAttendance>) {
    this.id = staffAttendance.id || this.getRandomID();
    this.img = staffAttendance.img || 'assets/images/user/new.jpg';
    this.name = staffAttendance.name || '';
    this.employee_id = staffAttendance.employee_id || '';
    this.designation = staffAttendance.designation || '';
    this.date = staffAttendance.date || '';
    this.check_in = staffAttendance.check_in || '';
    this.break = staffAttendance.break || '';
    this.check_out = staffAttendance.check_out || '';
    this.total = staffAttendance.total || '';
    this.shift = staffAttendance.shift || '';
    this.late_arrival = staffAttendance.late_arrival || '';
    this.early_departure = staffAttendance.early_departure || '';
    this.absence_reason = staffAttendance.absence_reason || '';
    this.overtime = staffAttendance.overtime || '';
    this.total_breaks = staffAttendance.total_breaks || '';
    this.remarks = staffAttendance.remarks || '';
    this.attendance_status = staffAttendance.attendance_status || '';
    this.department = staffAttendance.department || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
