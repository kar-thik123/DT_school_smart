import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { GradeSubmission } from './grade-submission.model';

@Injectable({
  providedIn: 'root',
})
export class GradeSubmissionService {
  private httpClient = inject(HttpClient);

  private readonly mockData: GradeSubmission[] = [
    { id: 1, rollNo: '101', studentName: 'John Doe', averageMarks: 88, grade: 'A+', status: 'Submitted', submissionDate: '2025-12-26' },
    { id: 2, rollNo: '102', studentName: 'Jane Smith', averageMarks: 82, grade: 'A', status: 'Submitted', submissionDate: '2025-12-26' },
    { id: 3, rollNo: '103', studentName: 'Alice Johnson', averageMarks: 94, grade: 'A+', status: 'Submitted', submissionDate: '2025-12-26' },
    { id: 4, rollNo: '104', studentName: 'Bob Brown', averageMarks: 73, grade: 'B', status: 'Draft', submissionDate: '-' },
    { id: 5, rollNo: '105', studentName: 'Charlie Davis', averageMarks: 78, grade: 'B+', status: 'Submitted', submissionDate: '2025-12-25' },
    { id: 6, rollNo: '106', studentName: 'Eva White', averageMarks: 86, grade: 'A', status: 'Submitted', submissionDate: '2025-12-25' },
    { id: 7, rollNo: '107', studentName: 'Frank Black', averageMarks: 80, grade: 'A', status: 'Draft', submissionDate: '-' },
    { id: 8, rollNo: '108', studentName: 'Grace Miller', averageMarks: 98, grade: 'A+', status: 'Submitted', submissionDate: '2025-12-24' },
    { id: 9, rollNo: '109', studentName: 'Henry Wilson', averageMarks: 60, grade: 'C', status: 'Not Started', submissionDate: '-' },
    { id: 10, rollNo: '110', studentName: 'Isabella Taylor', averageMarks: 90, grade: 'A+', status: 'Submitted', submissionDate: '2025-12-24' },
    { id: 11, rollNo: '111', studentName: 'Jack Anderson', averageMarks: 80, grade: 'A', status: 'Submitted', submissionDate: '2025-12-23' },
    { id: 12, rollNo: '112', studentName: 'Katherine Thomas', averageMarks: 91, grade: 'A+', status: 'Submitted', submissionDate: '2025-12-23' },
  ];

  getAllGradeSubmissions(): Observable<GradeSubmission[]> {
    return of(this.mockData);
  }

  addGradeSubmission(gradeSubmission: GradeSubmission): Observable<GradeSubmission> {
    this.mockData.unshift(gradeSubmission);
    return of(gradeSubmission);
  }

  updateGradeSubmission(gradeSubmission: GradeSubmission): Observable<GradeSubmission> {
    const index = this.mockData.findIndex((it) => it.id === gradeSubmission.id);
    if (index !== -1) {
      this.mockData[index] = gradeSubmission;
    }
    return of(gradeSubmission);
  }

  deleteGradeSubmission(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}

