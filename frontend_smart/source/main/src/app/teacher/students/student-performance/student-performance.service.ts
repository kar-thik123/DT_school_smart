import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { StudentPerformance } from './student-performance.model';

@Injectable({
  providedIn: 'root',
})
export class StudentPerformanceService {
  private httpClient = inject(HttpClient);

  private readonly mockData: StudentPerformance[] = [
    { id: 1, rollNo: '101', name: 'John Doe', subject: 'Mathematics', internalMarks: 25, externalMarks: 65, totalMarks: 90, grade: 'A+' },
    { id: 2, rollNo: '102', name: 'Jane Smith', subject: 'Physics', internalMarks: 22, externalMarks: 60, totalMarks: 82, grade: 'A' },
    { id: 3, rollNo: '103', name: 'Alice Johnson', subject: 'Chemistry', internalMarks: 28, externalMarks: 68, totalMarks: 96, grade: 'A+' },
    { id: 4, rollNo: '104', name: 'Bob Brown', subject: 'Biology', internalMarks: 18, externalMarks: 55, totalMarks: 73, grade: 'B' },
    { id: 5, rollNo: '105', name: 'Charlie Davis', subject: 'English', internalMarks: 20, externalMarks: 58, totalMarks: 78, grade: 'B+' },
    { id: 6, rollNo: '106', name: 'Eva White', subject: 'History', internalMarks: 24, externalMarks: 62, totalMarks: 86, grade: 'A' },
    { id: 7, rollNo: '107', name: 'Frank Black', subject: 'Geography', internalMarks: 21, externalMarks: 59, totalMarks: 80, grade: 'A' },
    { id: 8, rollNo: '108', name: 'Grace Miller', subject: 'PE', internalMarks: 30, externalMarks: 70, totalMarks: 100, grade: 'A+' },
    { id: 9, rollNo: '109', name: 'Henry Wilson', subject: 'Mathematics', internalMarks: 15, externalMarks: 45, totalMarks: 60, grade: 'C' },
    { id: 10, rollNo: '110', name: 'Isabella Taylor', subject: 'Physics', internalMarks: 26, externalMarks: 64, totalMarks: 90, grade: 'A+' },
    { id: 11, rollNo: '111', name: 'Jack Anderson', subject: 'Chemistry', internalMarks: 23, externalMarks: 57, totalMarks: 80, grade: 'A' },
    { id: 12, rollNo: '112', name: 'Katherine Thomas', subject: 'Biology', internalMarks: 27, externalMarks: 63, totalMarks: 90, grade: 'A+' },
  ];

  getAllPerformance(): Observable<StudentPerformance[]> {
    return of(this.mockData);
  }

  addPerformance(performance: StudentPerformance): Observable<StudentPerformance> {
    this.mockData.unshift(performance);
    return of(performance);
  }

  updatePerformance(performance: StudentPerformance): Observable<StudentPerformance> {
    const index = this.mockData.findIndex((it) => it.id === performance.id);
    if (index !== -1) {
      this.mockData[index] = performance;
    }
    return of(performance);
  }

  deletePerformance(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}

