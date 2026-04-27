import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { AttendanceReport, IAttendanceReport } from './attendance-report.model';

@Injectable({
  providedIn: 'root',
})
export class AttendanceReportService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<AttendanceReport[]> = new BehaviorSubject<
    AttendanceReport[]
  >([]);

  private staticData: IAttendanceReport[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      reportType: 'Monthly Attendance',
      className: 'Class 10-A',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 95.5,
      generatedBy: 'John Doe',
      date: '2024-12-01',
      status: 'Completed',
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      reportType: 'Weekly Attendance',
      className: 'Class 9-B',
      dateFrom: '2024-12-01',
      dateTo: '2024-12-07',
      attendancePercentage: 92.0,
      generatedBy: 'Sarah Smith',
      date: '2024-12-08',
      status: 'Completed',
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      reportType: 'Term Attendance',
      className: 'Class 12-A',
      dateFrom: '2024-09-01',
      dateTo: '2024-11-30',
      attendancePercentage: 88.5,
      generatedBy: 'Mike Johnson',
      date: '2024-12-10',
      status: 'Pending',
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      reportType: 'Daily Attendance',
      className: 'Class 8-C',
      dateFrom: '2024-12-15',
      dateTo: '2024-12-15',
      attendancePercentage: 98.0,
      generatedBy: 'Emily Davis',
      date: '2024-12-15',
      status: 'Completed',
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      reportType: 'Monthly Attendance',
      className: 'Class 11-B',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 94.2,
      generatedBy: 'David Wilson',
      date: '2024-12-02',
      status: 'Completed',
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      reportType: 'Subject Wise Attendance',
      className: 'Class 7-A',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 90.5,
      generatedBy: 'Lisa Brown',
      date: '2024-12-15',
      status: 'In Progress',
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      reportType: 'Student Wise Attendance',
      className: 'Class 10-B',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 85.0,
      generatedBy: 'Robert Taylor',
      date: '2024-12-14',
      status: 'Completed',
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      reportType: 'Monthly Attendance',
      className: 'Class 9-A',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 96.8,
      generatedBy: 'Jennifer White',
      date: '2024-12-03',
      status: 'Completed',
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      reportType: 'Defaulter List',
      className: 'Class 12-C',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 65.0,
      generatedBy: 'William Clark',
      date: '2024-12-12',
      status: 'Pending',
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      reportType: 'Monthly Attendance',
      className: 'Class 8-A',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 93.0,
      generatedBy: 'Amanda Lee',
      date: '2024-12-04',
      status: 'Completed',
    },
    {
      id: 11,
      img: 'assets/images/user/user11.jpg',
      reportType: 'Monthly Attendance',
      className: 'Class 11-C',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 91.5,
      generatedBy: 'Chris Martin',
      date: '2024-12-05',
      status: 'Completed',
    },
    {
      id: 12,
      img: 'assets/images/user/user6.jpg',
      reportType: 'Yearly Attendance',
      className: 'Class 10-C',
      dateFrom: '2024-01-01',
      dateTo: '2024-11-30',
      attendancePercentage: 89.0,
      generatedBy: 'Jessica King',
      date: '2024-12-09',
      status: 'In Progress',
    },
    {
      id: 13,
      img: 'assets/images/user/user1.jpg',
      reportType: 'Monthly Attendance',
      className: 'Class 9-C',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      attendancePercentage: 94.5,
      generatedBy: 'Matthew Hall',
      date: '2024-12-01',
      status: 'Completed',
    },
  ];

  getAllAttendanceReports(): Observable<AttendanceReport[]> {
    return of(this.staticData as AttendanceReport[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addAttendanceReport(report: AttendanceReport): Observable<AttendanceReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateAttendanceReport(
    report: AttendanceReport
  ): Observable<AttendanceReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteAttendanceReport(id: number): Observable<number> {
    return of(id).pipe(
      map((_response) => id),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
