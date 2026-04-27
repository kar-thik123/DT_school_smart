export interface DailyAttendance {
  id: number;
  rollNo: string;
  studentName: string;
  class: string;
  date: string;
  status: string; // 'Present', 'Absent', 'Late'
  note: string;
}
