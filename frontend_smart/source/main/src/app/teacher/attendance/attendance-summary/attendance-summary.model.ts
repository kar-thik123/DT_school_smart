export interface AttendanceSummary {
  id: number;
  class: string;
  subject: string;
  totalStudents: number;
  present: number;
  absent: number;
  onLeave: number;
  attendancePercentage: string;
  date: string;
}
