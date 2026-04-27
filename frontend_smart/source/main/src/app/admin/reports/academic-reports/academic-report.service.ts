import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { AcademicReport, IAcademicReport } from './academic-report.model';

@Injectable({
  providedIn: 'root',
})
export class AcademicReportService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<AcademicReport[]> = new BehaviorSubject<
    AcademicReport[]
  >([]);

  private staticData: IAcademicReport[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      reportType: 'Progress Report',
      className: 'Class 10-A',
      subject: 'Mathematics',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'John Doe',
      date: '2024-12-20',
      status: 'Completed',
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      reportType: 'Performance Analysis',
      className: 'Class 9-B',
      subject: 'Science',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'Sarah Smith',
      date: '2024-12-19',
      status: 'Completed',
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      reportType: 'Grade Summary',
      className: 'Class 12-A',
      subject: 'Physics',
      academicYear: '2024-25',
      term: 'Second Term',
      generatedBy: 'Mike Johnson',
      date: '2024-12-18',
      status: 'Pending',
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      reportType: 'Subject Wise Report',
      className: 'Class 8-C',
      subject: 'English',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'Emily Davis',
      date: '2024-12-17',
      status: 'Completed',
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      reportType: 'Progress Report',
      className: 'Class 11-B',
      subject: 'Chemistry',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'David Wilson',
      date: '2024-12-16',
      status: 'Completed',
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      reportType: 'Class Performance',
      className: 'Class 7-A',
      subject: 'History',
      academicYear: '2024-25',
      term: 'Second Term',
      generatedBy: 'Lisa Brown',
      date: '2024-12-15',
      status: 'In Progress',
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      reportType: 'Term Report',
      className: 'Class 10-B',
      subject: 'Biology',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'Robert Taylor',
      date: '2024-12-14',
      status: 'Completed',
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      reportType: 'Progress Report',
      className: 'Class 9-A',
      subject: 'Computer Science',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'Jennifer White',
      date: '2024-12-13',
      status: 'Completed',
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      reportType: 'Assessment Report',
      className: 'Class 12-C',
      subject: 'Economics',
      academicYear: '2024-25',
      term: 'Second Term',
      generatedBy: 'William Clark',
      date: '2024-12-12',
      status: 'Pending',
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      reportType: 'Grade Summary',
      className: 'Class 8-A',
      subject: 'Geography',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'Amanda Lee',
      date: '2024-12-11',
      status: 'Completed',
    },
    {
      id: 11,
      img: 'assets/images/user/user11.jpg',
      reportType: 'Performance Analysis',
      className: 'Class 11-C',
      subject: 'Accounts',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'Chris Martin',
      date: '2024-12-10',
      status: 'Completed',
    },
    {
      id: 12,
      img: 'assets/images/user/user6.jpg',
      reportType: 'Subject Wise Report',
      className: 'Class 10-C',
      subject: 'Business Studies',
      academicYear: '2024-25',
      term: 'Second Term',
      generatedBy: 'Jessica King',
      date: '2024-12-09',
      status: 'In Progress',
    },
    {
      id: 13,
      img: 'assets/images/user/user1.jpg',
      reportType: 'Progress Report',
      className: 'Class 9-C',
      subject: 'Political Science',
      academicYear: '2024-25',
      term: 'First Term',
      generatedBy: 'Matthew Hall',
      date: '2024-12-08',
      status: 'Completed',
    },
  ];

  getAllAcademicReports(): Observable<AcademicReport[]> {
    return of(this.staticData as AcademicReport[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addAcademicReport(report: AcademicReport): Observable<AcademicReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateAcademicReport(report: AcademicReport): Observable<AcademicReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteAcademicReport(id: number): Observable<number> {
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
