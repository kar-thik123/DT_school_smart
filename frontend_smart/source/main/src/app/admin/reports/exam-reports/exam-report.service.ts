import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { ExamReport, IExamReport } from './exam-report.model';

@Injectable({
  providedIn: 'root',
})
export class ExamReportService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<ExamReport[]> = new BehaviorSubject<ExamReport[]>(
    []
  );

  private staticData: IExamReport[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      examName: 'First Term Exam',
      className: 'Class 10-A',
      subject: 'Mathematics',
      examDate: '2024-11-15',
      passPercentage: 88.5,
      averageMarks: 72,
      generatedBy: 'John Doe',
      date: '2024-12-01',
      status: 'Completed',
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      examName: 'Mid Term Exam',
      className: 'Class 9-B',
      subject: 'Science',
      examDate: '2024-11-20',
      passPercentage: 92.0,
      averageMarks: 78,
      generatedBy: 'Sarah Smith',
      date: '2024-12-08',
      status: 'Completed',
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      examName: 'Final Exam',
      className: 'Class 12-A',
      subject: 'Physics',
      examDate: '2024-11-25',
      passPercentage: 85.5,
      averageMarks: 68,
      generatedBy: 'Mike Johnson',
      date: '2024-12-10',
      status: 'Pending',
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      examName: 'Unit Test 2',
      className: 'Class 8-C',
      subject: 'English',
      examDate: '2024-11-10',
      passPercentage: 95.0,
      averageMarks: 82,
      generatedBy: 'Emily Davis',
      date: '2024-12-15',
      status: 'Completed',
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      examName: 'First Term Exam',
      className: 'Class 11-B',
      subject: 'Chemistry',
      examDate: '2024-11-15',
      passPercentage: 84.2,
      averageMarks: 70,
      generatedBy: 'David Wilson',
      date: '2024-12-02',
      status: 'Completed',
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      examName: 'Weekly Test',
      className: 'Class 7-A',
      subject: 'History',
      examDate: '2024-11-18',
      passPercentage: 90.5,
      averageMarks: 75,
      generatedBy: 'Lisa Brown',
      date: '2024-12-15',
      status: 'In Progress',
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      examName: 'Practical Exam',
      className: 'Class 10-B',
      subject: 'Biology',
      examDate: '2024-11-12',
      passPercentage: 88.0,
      averageMarks: 74,
      generatedBy: 'Robert Taylor',
      date: '2024-12-14',
      status: 'Completed',
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      examName: 'First Term Exam',
      className: 'Class 9-A',
      subject: 'Computer',
      examDate: '2024-11-15',
      passPercentage: 96.8,
      averageMarks: 85,
      generatedBy: 'Jennifer White',
      date: '2024-12-03',
      status: 'Completed',
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      examName: 'Re-Exam',
      className: 'Class 12-C',
      subject: 'Economics',
      examDate: '2024-11-22',
      passPercentage: 65.0,
      averageMarks: 58,
      generatedBy: 'William Clark',
      date: '2024-12-12',
      status: 'Pending',
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      examName: 'First Term Exam',
      className: 'Class 8-A',
      subject: 'Geography',
      examDate: '2024-11-15',
      passPercentage: 91.0,
      averageMarks: 79,
      generatedBy: 'Amanda Lee',
      date: '2024-12-04',
      status: 'Completed',
    },
    {
      id: 11,
      img: 'assets/images/user/user11.jpg',
      examName: 'First Term Exam',
      className: 'Class 11-C',
      subject: 'Accounts',
      examDate: '2024-11-15',
      passPercentage: 89.5,
      averageMarks: 76,
      generatedBy: 'Chris Martin',
      date: '2024-12-05',
      status: 'Completed',
    },
    {
      id: 12,
      img: 'assets/images/user/user6.jpg',
      examName: 'Final Exam',
      className: 'Class 10-C',
      subject: 'Business',
      examDate: '2024-11-28',
      passPercentage: 87.0,
      averageMarks: 73,
      generatedBy: 'Jessica King',
      date: '2024-12-09',
      status: 'In Progress',
    },
    {
      id: 13,
      img: 'assets/images/user/user1.jpg',
      examName: 'First Term Exam',
      className: 'Class 9-C',
      subject: 'Art',
      examDate: '2024-11-15',
      passPercentage: 94.5,
      averageMarks: 81,
      generatedBy: 'Matthew Hall',
      date: '2024-12-01',
      status: 'Completed',
    },
  ];

  getAllExamReports(): Observable<ExamReport[]> {
    return of(this.staticData as ExamReport[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addExamReport(report: ExamReport): Observable<ExamReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateExamReport(report: ExamReport): Observable<ExamReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteExamReport(id: number): Observable<number> {
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
