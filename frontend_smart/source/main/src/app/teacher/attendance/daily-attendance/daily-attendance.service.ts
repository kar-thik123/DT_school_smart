import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DailyAttendance } from './daily-attendance.model';

@Injectable({
  providedIn: 'root',
})
export class DailyAttendanceService {
  private httpClient = inject(HttpClient);

  private readonly mockData: DailyAttendance[] = [
    { id: 1, rollNo: '101', studentName: 'John Doe', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
    { id: 2, rollNo: '102', studentName: 'Jane Smith', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
    { id: 3, rollNo: '103', studentName: 'Alice Johnson', class: '10A', date: '2025-12-26', status: 'Absent', note: 'Sick' },
    { id: 4, rollNo: '104', studentName: 'Bob Brown', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
    { id: 5, rollNo: '105', studentName: 'Charlie Davis', class: '10A', date: '2025-12-26', status: 'Late', note: 'Bus delayed' },
    { id: 6, rollNo: '106', studentName: 'Eva White', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
    { id: 7, rollNo: '107', studentName: 'Frank Black', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
    { id: 8, rollNo: '108', studentName: 'Grace Miller', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
    { id: 9, rollNo: '109', studentName: 'Henry Wilson', class: '10A', date: '2025-12-26', status: 'Absent', note: '-' },
    { id: 10, rollNo: '110', studentName: 'Isabella Taylor', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
    { id: 11, rollNo: '111', studentName: 'Jack Anderson', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
    { id: 12, rollNo: '112', studentName: 'Katherine Thomas', class: '10A', date: '2025-12-26', status: 'Present', note: '-' },
  ];

  getDailyAttendance(): Observable<DailyAttendance[]> {
    return of(this.mockData);
  }

  addDailyAttendance(attendance: DailyAttendance): Observable<DailyAttendance> {
    this.mockData.unshift(attendance);
    return of(attendance);
  }

  updateDailyAttendance(attendance: DailyAttendance): Observable<DailyAttendance> {
    const index = this.mockData.findIndex((it) => it.id === attendance.id);
    if (index !== -1) {
      this.mockData[index] = attendance;
    }
    return of(attendance);
  }

  deleteDailyAttendance(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}


