import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MyAttendance } from './my-attendance.model';

@Injectable({
  providedIn: 'root',
})
export class MyAttendanceService {
  private readonly data: MyAttendance[] = [
    { id: 1, date: '2025-12-01', status: 'Present', checkIn: '08:30 AM', checkOut: '03:30 PM', workingHours: '7h 00m', remarks: 'On time' },
    { id: 2, date: '2025-12-02', status: 'Present', checkIn: '08:25 AM', checkOut: '03:35 PM', workingHours: '7h 10m', remarks: 'Early' },
    { id: 3, date: '2025-12-03', status: 'Late', checkIn: '09:05 AM', checkOut: '03:30 PM', workingHours: '6h 25m', remarks: 'Traffic' },
    { id: 4, date: '2025-12-04', status: 'Present', checkIn: '08:30 AM', checkOut: '03:30 PM', workingHours: '7h 00m', remarks: 'On time' },
    { id: 5, date: '2025-12-05', status: 'Half Day', checkIn: '08:30 AM', checkOut: '12:00 PM', workingHours: '3h 30m', remarks: 'Medical appointment' },
    { id: 6, date: '2025-12-08', status: 'Present', checkIn: '08:20 AM', checkOut: '03:40 PM', workingHours: '7h 20m', remarks: 'On time' },
    { id: 7, date: '2025-12-09', status: 'Absent', checkIn: '-', checkOut: '-', workingHours: '0h 00m', remarks: 'Sick leave' },
    { id: 8, date: '2025-12-10', status: 'Present', checkIn: '08:30 AM', checkOut: '03:30 PM', workingHours: '7h 00m', remarks: 'On time' },
    { id: 9, date: '2025-12-11', status: 'Present', checkIn: '08:30 AM', checkOut: '03:30 PM', workingHours: '7h 00m', remarks: 'On time' },
    { id: 10, date: '2025-12-12', status: 'Present', checkIn: '08:30 AM', checkOut: '03:30 PM', workingHours: '7h 00m', remarks: 'On time' },
    { id: 11, date: '2025-12-15', status: 'Late', checkIn: '08:45 AM', checkOut: '03:30 PM', workingHours: '6h 45m', remarks: 'Late bus' },
    { id: 12, date: '2025-12-16', status: 'Present', checkIn: '08:30 AM', checkOut: '03:30 PM', workingHours: '7h 00m', remarks: 'On time' },
  ];

  dataChange: BehaviorSubject<MyAttendance[]> = new BehaviorSubject<MyAttendance[]>([]);

  constructor() {}

  get dataItems(): MyAttendance[] {
    return this.dataChange.value;
  }

  getAllAttendance(): Observable<MyAttendance[]> {
    return of(this.data);
  }

  addAttendance(attendance: MyAttendance): void {
    this.data.unshift(attendance);
  }

  updateAttendance(attendance: MyAttendance): void {
    const index = this.data.findIndex((it) => it.id === attendance.id);
    if (index !== -1) {
      this.data[index] = attendance;
    }
  }

  deleteAttendance(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
