import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Attendance } from './attendance.model';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly attendanceList: Attendance[] = [
    new Attendance({
      id: 1,
      img: 'assets/images/user/user1.jpg',
      student_name: 'John Doe',
      roll_no: '101',
      hostel_name: 'Sunrise Hostel',
      room_no: '101',
      attendance_date: '2025-01-20',
      status: 'Present',
    }),
    new Attendance({
      id: 2,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Jane Smith',
      roll_no: '102',
      hostel_name: 'Sunrise Hostel',
      room_no: '102',
      attendance_date: '2025-01-20',
      status: 'Absent',
    }),
    new Attendance({
      id: 3,
      img: 'assets/images/user/user3.jpg',
      student_name: 'Robert Brown',
      roll_no: '103',
      hostel_name: 'Sunset Villa',
      room_no: '201',
      attendance_date: '2025-01-20',
      status: 'Present',
    }),
    new Attendance({
      id: 4,
      img: 'assets/images/user/user4.jpg',
      student_name: 'Emily Davis',
      roll_no: '104',
      hostel_name: 'Sunset Villa',
      room_no: '202',
      attendance_date: '2025-01-20',
      status: 'Late',
    }),
    new Attendance({
      id: 5,
      img: 'assets/images/user/user5.jpg',
      student_name: 'Michael Wilson',
      roll_no: '105',
      hostel_name: 'Sunrise Hostel',
      room_no: '103',
      attendance_date: '2025-01-20',
      status: 'Present',
    }),
    new Attendance({
      id: 6,
      img: 'assets/images/user/user6.jpg',
      student_name: 'Sarah Parker',
      roll_no: '106',
      hostel_name: 'Sunrise Hostel',
      room_no: '104',
      attendance_date: '2025-01-21',
      status: 'Present',
    }),
    new Attendance({
      id: 7,
      img: 'assets/images/user/user7.jpg',
      student_name: 'David Lee',
      roll_no: '107',
      hostel_name: 'Sunset Villa',
      room_no: '203',
      attendance_date: '2025-01-21',
      status: 'Absent',
    }),
    new Attendance({
      id: 8,
      img: 'assets/images/user/user8.jpg',
      student_name: 'Emma Watson',
      roll_no: '108',
      hostel_name: 'Sunset Villa',
      room_no: '204',
      attendance_date: '2025-01-21',
      status: 'Present',
    }),
    new Attendance({
      id: 9,
      img: 'assets/images/user/user9.jpg',
      student_name: 'Chris Evans',
      roll_no: '109',
      hostel_name: 'Sunrise Hostel',
      room_no: '105',
      attendance_date: '2025-01-22',
      status: 'Present',
    }),
    new Attendance({
      id: 10,
      img: 'assets/images/user/user10.jpg',
      student_name: 'Jessica Alba',
      roll_no: '110',
      hostel_name: 'Sunset Villa',
      room_no: '205',
      attendance_date: '2025-01-22',
      status: 'Late',
    }),
    new Attendance({
      id: 11,
      img: 'assets/images/user/user11.jpg',
      student_name: 'Tom Cruise',
      roll_no: '111',
      hostel_name: 'Sunrise Hostel',
      room_no: '106',
      attendance_date: '2025-01-22',
      status: 'Present',
    }),
    new Attendance({
      id: 12,
      img: 'assets/images/user/user1.jpg',
      student_name: 'Will Smith',
      roll_no: '112',
      hostel_name: 'Sunset Villa',
      room_no: '206',
      attendance_date: '2025-01-22',
      status: 'Present',
    }),
  ];

  dataChange: BehaviorSubject<Attendance[]> = new BehaviorSubject<Attendance[]>([]);

  /** GET: Fetch all attendance records */
  getAllAttendance(): Observable<Attendance[]> {
    this.dataChange.next(this.attendanceList);
    return of(this.attendanceList);
  }

  /** POST: Add a new attendance record */
  addAttendance(attendance: Attendance): Observable<Attendance> {
    this.attendanceList.unshift(attendance);
    this.dataChange.next(this.attendanceList);
    return of(attendance);
  }

  /** PUT: Update an existing attendance record */
  updateAttendance(attendance: Attendance): Observable<Attendance> {
    const index = this.attendanceList.findIndex((it) => it.id === attendance.id);
    if (index !== -1) {
      this.attendanceList[index] = attendance;
      this.dataChange.next(this.attendanceList);
    }
    return of(attendance);
  }

  /** DELETE: Remove an attendance record by ID */
  deleteAttendance(id: number): Observable<number> {
    const index = this.attendanceList.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.attendanceList.splice(index, 1);
      this.dataChange.next(this.attendanceList);
    }
    return of(id);
  }
}
