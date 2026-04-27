import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AttendanceSummary } from './attendance-summary.model';

@Injectable({
  providedIn: 'root',
})
export class AttendanceSummaryService {
  private httpClient = inject(HttpClient);

  private readonly mockData: AttendanceSummary[] = [
    { id: 1, class: '10A', subject: 'Mathematics', totalStudents: 40, present: 38, absent: 2, onLeave: 0, attendancePercentage: '95%', date: '2025-12-26' },
    { id: 2, class: '11B', subject: 'Physics', totalStudents: 35, present: 32, absent: 2, onLeave: 1, attendancePercentage: '91.4%', date: '2025-12-26' },
    { id: 3, class: '12C', subject: 'Chemistry', totalStudents: 30, present: 29, absent: 1, onLeave: 0, attendancePercentage: '96.6%', date: '2025-12-26' },
    { id: 4, class: '10B', subject: 'Biology', totalStudents: 42, present: 40, absent: 1, onLeave: 1, attendancePercentage: '95.2%', date: '2025-12-25' },
    { id: 5, class: '9A', subject: 'English', totalStudents: 45, present: 43, absent: 2, onLeave: 0, attendancePercentage: '95.5%', date: '2025-12-25' },
    { id: 6, class: '11A', subject: 'History', totalStudents: 38, present: 35, absent: 2, onLeave: 1, attendancePercentage: '92.1%', date: '2025-12-25' },
    { id: 7, class: '12B', subject: 'Geography', totalStudents: 32, present: 31, absent: 1, onLeave: 0, attendancePercentage: '96.8%', date: '2025-12-24' },
    { id: 8, class: '9B', subject: 'PE', totalStudents: 44, present: 42, absent: 2, onLeave: 0, attendancePercentage: '95.4%', date: '2025-12-24' },
    { id: 9, class: '10A', subject: 'Mathematics', totalStudents: 40, present: 39, absent: 1, onLeave: 0, attendancePercentage: '97.5%', date: '2025-12-24' },
    { id: 10, class: '11B', subject: 'Physics', totalStudents: 35, present: 33, absent: 2, onLeave: 0, attendancePercentage: '94.2%', date: '2025-12-23' },
    { id: 11, class: '12C', subject: 'Chemistry', totalStudents: 30, present: 28, absent: 2, onLeave: 0, attendancePercentage: '93.3%', date: '2025-12-23' },
    { id: 12, class: '10B', subject: 'Biology', totalStudents: 42, present: 41, absent: 0, onLeave: 1, attendancePercentage: '97.6%', date: '2025-12-23' },
  ];

  getAllSummaries(): Observable<AttendanceSummary[]> {
    return of(this.mockData);
  }

  addSummary(summary: AttendanceSummary): Observable<AttendanceSummary> {
    this.mockData.unshift(summary);
    return of(summary);
  }

  updateSummary(summary: AttendanceSummary): Observable<AttendanceSummary> {
    const index = this.mockData.findIndex((it) => it.id === summary.id);
    if (index !== -1) {
      this.mockData[index] = summary;
    }
    return of(summary);
  }

  deleteSummary(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}


