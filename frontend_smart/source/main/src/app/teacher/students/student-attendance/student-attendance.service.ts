import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { StudentAttendance } from './student-attendance.model';

@Injectable({
  providedIn: 'root',
})
export class StudentAttendanceService {
  private httpClient = inject(HttpClient);

  private readonly mockData: StudentAttendance[] = [
    { id: 1, rollNo: '101', name: 'John Doe', date: '2025-12-26', status: 'Present', remarks: '-' },
    { id: 2, rollNo: '102', name: 'Jane Smith', date: '2025-12-26', status: 'Present', remarks: '-' },
    { id: 3, rollNo: '103', name: 'Alice Johnson', date: '2025-12-26', status: 'Absent', remarks: 'Sick' },
    { id: 4, rollNo: '104', name: 'Bob Brown', date: '2025-12-26', status: 'Present', remarks: '-' },
    { id: 5, rollNo: '105', name: 'Charlie Davis', date: '2025-12-26', status: 'Late', remarks: 'Bus late' },
    { id: 6, rollNo: '106', name: 'Eva White', date: '2025-12-26', status: 'Present', remarks: '-' },
    { id: 7, rollNo: '107', name: 'Frank Black', date: '2025-12-26', status: 'Present', remarks: '-' },
    { id: 8, rollNo: '108', name: 'Grace Miller', date: '2025-12-26', status: 'Present', remarks: '-' },
    { id: 9, rollNo: '109', name: 'Henry Wilson', date: '2025-12-26', status: 'Absent', remarks: 'Uninformed' },
    { id: 10, rollNo: '110', name: 'Isabella Taylor', date: '2025-12-26', status: 'Present', remarks: '-' },
    { id: 11, rollNo: '111', name: 'Jack Anderson', date: '2025-12-26', status: 'Present', remarks: '-' },
    { id: 12, rollNo: '112', name: 'Katherine Thomas', date: '2025-12-26', status: 'Present', remarks: '-' },
  ];

  getAllAttendance(): Observable<StudentAttendance[]> {
    return of(this.mockData);
  }

  addAttendance(attendance: StudentAttendance): Observable<StudentAttendance> {
    this.mockData.unshift(attendance);
    return of(attendance);
  }

  updateAttendance(attendance: StudentAttendance): Observable<StudentAttendance> {
    const index = this.mockData.findIndex((it) => it.id === attendance.id);
    if (index !== -1) {
      this.mockData[index] = attendance;
    }
    return of(attendance);
  }

  deleteAttendance(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}

