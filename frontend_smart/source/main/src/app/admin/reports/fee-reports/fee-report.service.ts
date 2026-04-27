import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { FeeReport, IFeeReport } from './fee-report.model';

@Injectable({
  providedIn: 'root',
})
export class FeeReportService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<FeeReport[]> = new BehaviorSubject<FeeReport[]>(
    []
  );

  private staticData: IFeeReport[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      reportType: 'Fee Collection',
      feeCategory: 'Tuition Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 450000,
      generatedBy: 'John Doe',
      date: '2024-12-01',
      status: 'Completed',
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      reportType: 'Due Fees',
      feeCategory: 'Hostel Fee',
      dateFrom: '2024-12-01',
      dateTo: '2024-12-07',
      totalAmount: 125000,
      generatedBy: 'Sarah Smith',
      date: '2024-12-08',
      status: 'Completed',
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      reportType: 'Fee Summary',
      feeCategory: 'Transport Fee',
      dateFrom: '2024-09-01',
      dateTo: '2024-11-30',
      totalAmount: 78000,
      generatedBy: 'Mike Johnson',
      date: '2024-12-10',
      status: 'Pending',
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      reportType: 'Miscellaneous Fees',
      feeCategory: 'Library Fee',
      dateFrom: '2024-12-15',
      dateTo: '2024-12-15',
      totalAmount: 5400,
      generatedBy: 'Emily Davis',
      date: '2024-12-15',
      status: 'Completed',
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      reportType: 'Fee Collection',
      feeCategory: 'Lab Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 32000,
      generatedBy: 'David Wilson',
      date: '2024-12-02',
      status: 'Completed',
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      reportType: 'Discount Report',
      feeCategory: 'Tuition Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 15000,
      generatedBy: 'Lisa Brown',
      date: '2024-12-15',
      status: 'In Progress',
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      reportType: 'Refund Report',
      feeCategory: 'Admission Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 8500,
      generatedBy: 'Robert Taylor',
      date: '2024-12-14',
      status: 'Completed',
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      reportType: 'Fee Collection',
      feeCategory: 'Exam Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 56800,
      generatedBy: 'Jennifer White',
      date: '2024-12-03',
      status: 'Completed',
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      reportType: 'Overdue List',
      feeCategory: 'Tuition Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 245000,
      generatedBy: 'William Clark',
      date: '2024-12-12',
      status: 'Pending',
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      reportType: 'Fee Collection',
      feeCategory: 'Registration Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 12000,
      generatedBy: 'Amanda Lee',
      date: '2024-12-04',
      status: 'Completed',
    },
    {
      id: 11,
      img: 'assets/images/user/user11.jpg',
      reportType: 'Fee Collection',
      feeCategory: 'Sports Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 9500,
      generatedBy: 'Chris Martin',
      date: '2024-12-05',
      status: 'Completed',
    },
    {
      id: 12,
      img: 'assets/images/user/user6.jpg',
      reportType: 'Yearly Fee Collection',
      feeCategory: 'Tuition Fee',
      dateFrom: '2024-01-01',
      dateTo: '2024-11-30',
      totalAmount: 5240000,
      generatedBy: 'Jessica King',
      date: '2024-12-09',
      status: 'In Progress',
    },
    {
      id: 13,
      img: 'assets/images/user/user1.jpg',
      reportType: 'Fee Collection',
      feeCategory: 'Miscellaneous Fee',
      dateFrom: '2024-11-01',
      dateTo: '2024-11-30',
      totalAmount: 4500,
      generatedBy: 'Matthew Hall',
      date: '2024-12-01',
      status: 'Completed',
    },
  ];

  getAllFeeReports(): Observable<FeeReport[]> {
    return of(this.staticData as FeeReport[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addFeeReport(report: FeeReport): Observable<FeeReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateFeeReport(report: FeeReport): Observable<FeeReport> {
    return of(report).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteFeeReport(id: number): Observable<number> {
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
