import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { CustomReport, ICustomReport } from './custom-report.model';

@Injectable({
  providedIn: 'root',
})
export class CustomReportService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<CustomReport[]> = new BehaviorSubject<CustomReport[]>([]);

  private staticData: ICustomReport[] = [
    { id: 1, reportName: 'Student Merit List', description: 'List of students with top marks in exams', category: 'Academic', createdBy: 'John Doe', date: '2024-12-01', status: 'Active' },
    { id: 2, reportName: 'Revenue Breakdown', description: 'Detailed breakdown of fee collection by category', category: 'Finance', createdBy: 'Sarah Smith', date: '2024-12-05', status: 'Active' },
    { id: 3, reportName: 'Teacher Loading', description: 'Subject wise and class wise teacher workload', category: 'Admin', createdBy: 'Mike Johnson', date: '2024-12-10', status: 'Draft' },
    { id: 4, reportName: 'Library Usage', description: 'Daily book issue and return statistics', category: 'Facilities', createdBy: 'Emily Davis', date: '2024-12-12', status: 'Active' },
    { id: 5, reportName: 'Scholarship List', description: 'Students eligible for merit-based scholarships', category: 'Academic', createdBy: 'David Wilson', date: '2024-12-02', status: 'Active' },
    { id: 6, reportName: 'Transport Occupancy', description: 'Bus wise student count and route tracking', category: 'Facilities', createdBy: 'Lisa Brown', date: '2024-12-15', status: 'Archived' },
    { id: 7, reportName: 'Hostel Vacancy', description: 'Room wise availability and student allocation', category: 'Facilities', createdBy: 'Robert Taylor', date: '2024-12-14', status: 'Active' },
    { id: 8, reportName: 'Exam Performance', description: 'Comparison of class performance over terms', category: 'Academic', createdBy: 'Jennifer White', date: '2024-12-03', status: 'Active' },
    { id: 9, reportName: 'Fee Defaulter SMS Log', description: 'Log of SMS reminders sent to parents', category: 'Communication', createdBy: 'William Clark', date: '2024-12-12', status: 'Draft' },
    { id: 10, reportName: 'Teacher Attendance', description: 'Monthly attendance summary for teaching staff', category: 'Admin', createdBy: 'Amanda Lee', date: '2024-12-04', status: 'Active' },
    { id: 11, reportName: 'Event Participation', description: 'Students participated in sports and cultural events', category: 'Extracurricular', createdBy: 'Chris Martin', date: '2024-12-05', status: 'Active' },
    { id: 12, reportName: 'Inventory Status', description: 'List of lab and sports equipment with condition', category: 'Admin', createdBy: 'Jessica King', date: '2024-12-09', status: 'Archived' },
    { id: 13, reportName: 'Parent Feedback', description: 'Summary of feedback collected during PTM', category: 'Communication', createdBy: 'Matthew Hall', date: '2024-12-15', status: 'Active' },
  ];

  getAllCustomReports(): Observable<CustomReport[]> {
    return of(this.staticData as CustomReport[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addCustomReport(report: CustomReport): Observable<CustomReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateCustomReport(report: CustomReport): Observable<CustomReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteCustomReport(id: number): Observable<number> {
    return of(id).pipe(
      map((_response) => id),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}
