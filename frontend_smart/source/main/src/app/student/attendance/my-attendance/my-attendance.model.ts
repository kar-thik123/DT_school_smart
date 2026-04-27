export interface MyAttendance {
  id: number;
  date: string;
  status: string; // Present, Absent, Late, Half Day
  checkIn: string;
  checkOut: string;
  workingHours: string;
  remarks: string;
}
