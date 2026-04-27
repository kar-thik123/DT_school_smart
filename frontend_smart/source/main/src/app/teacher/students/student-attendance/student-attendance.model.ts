export interface StudentAttendance {
  id: number;
  rollNo: string;
  name: string;
  date: string;
  status: string; // 'Present', 'Absent', 'Late', 'Excused'
  remarks: string;
}
