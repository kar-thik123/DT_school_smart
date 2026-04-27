import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { SmsEmail, ISmsEmail } from './sms-email.model';

@Injectable({
  providedIn: 'root',
})
export class SmsEmailService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<SmsEmail[]> = new BehaviorSubject<SmsEmail[]>([]);

  // Static data with 12+ records
  private staticData: ISmsEmail[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      type: 'Email',
      recipient: 'all-students@school.com',
      subject: 'Exam Schedule Announcement',
      sentBy: 'Examination Cell',
      sentDate: '2024-12-20',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message:
        'Dear Students, Final examination schedule has been published on school portal.',
      recipientGroup: 'All Students',
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      type: 'SMS',
      recipient: '+91-XXXXXXXXXX',
      subject: '',
      sentBy: 'Administration',
      sentDate: '2024-12-19',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message: 'School will remain closed tomorrow due to maintenance work.',
      recipientGroup: 'All Parents',
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      type: 'Email',
      recipient: 'teachers@school.com',
      subject: 'Faculty Meeting on December 25',
      sentBy: 'Principal Office',
      sentDate: '2024-12-18',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message:
        'Mandatory faculty meeting scheduled for December 25th at 2 PM in conference hall.',
      recipientGroup: 'All Teachers',
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      type: 'SMS',
      recipient: '+91-XXXXXXXXXX',
      subject: '',
      sentBy: 'Fee Department',
      sentDate: '2024-12-17',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message:
        'Fee payment reminder: Last date 31st Dec. Pay online to avoid penalties.',
      recipientGroup: 'All Parents',
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      type: 'Email',
      recipient: 'staff@school.com',
      subject: 'Annual Day Preparations',
      sentBy: 'Cultural Committee',
      sentDate: '2024-12-16',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message:
        'All staff members requested to participate in annual day preparations.',
      recipientGroup: 'All Staff',
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      type: 'SMS',
      recipient: '+91-XXXXXXXXXX',
      subject: '',
      sentBy: 'Transport Department',
      sentDate: '2024-12-15',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message: 'Bus route 5 timing changed to 7:00 AM from 23rd December.',
      recipientGroup: 'Custom',
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      type: 'Email',
      recipient: 'parents@school.com',
      subject: 'Parent-Teacher Meeting Invitation',
      sentBy: 'Academic Coordinator',
      sentDate: '2024-12-14',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message:
        'You are invited to PTM on December 30th. Please confirm your attendance.',
      recipientGroup: 'Parents',
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      type: 'SMS',
      recipient: '+91-XXXXXXXXXX',
      subject: '',
      sentBy: 'Health Department',
      sentDate: '2024-12-13',
      status: 'Sent',
      deliveryStatus: 'Failed',
      message: 'Health checkup camp on Jan 25-27. Please ensure attendance.',
      recipientGroup: 'All Students',
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      type: 'Email',
      recipient: 'students@school.com',
      subject: 'Library Book Return Reminder',
      sentBy: 'Library Department',
      sentDate: '2024-12-12',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message:
        'Please return all library books before December 24th to avoid fine.',
      recipientGroup: 'All Students',
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      type: 'SMS',
      recipient: '+91-XXXXXXXXXX',
      subject: '',
      sentBy: 'Sports Department',
      sentDate: '2024-12-11',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message: 'Sports day on Jan 15. Register your child for events by Jan 5.',
      recipientGroup: 'All Parents',
    },
    {
      id: 11,
      img: 'assets/images/user/user11.jpg',
      type: 'Email',
      recipient: 'teachers@school.com',
      subject: 'Result Declaration Schedule',
      sentBy: 'Examination Cell',
      sentDate: '2024-12-10',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message:
        'Results will be declared on January 15th. Please complete evaluation by January 10th.',
      recipientGroup: 'All Teachers',
    },
    {
      id: 12,
      img: 'assets/images/user/user6.jpg',
      type: 'SMS',
      recipient: '+91-XXXXXXXXXX',
      subject: '',
      sentBy: 'Administration',
      sentDate: '2024-12-09',
      status: 'Draft',
      deliveryStatus: 'Pending',
      message:
        'Annual function on Feb 10. Save the date for grand celebration.',
      recipientGroup: 'All',
    },
    {
      id: 13,
      img: 'assets/images/user/user1.jpg',
      type: 'Email',
      recipient: 'staff@school.com',
      subject: 'Salary Credit Notification',
      sentBy: 'Accounts Department',
      sentDate: '2024-12-08',
      status: 'Sent',
      deliveryStatus: 'Delivered',
      message:
        'December salary has been credited to your bank account. Check payslip on portal.',
      recipientGroup: 'All Staff',
    },
  ];

  /** GET: Fetch all SMS/Emails */
  getAllSmsEmails(): Observable<SmsEmail[]> {
    return of(this.staticData as SmsEmail[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new SMS/Email */
  addSmsEmail(smsEmail: SmsEmail): Observable<SmsEmail> {
    return of(smsEmail).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing SMS/Email */
  updateSmsEmail(smsEmail: SmsEmail): Observable<SmsEmail> {
    return of(smsEmail).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove an SMS/Email by ID */
  deleteSmsEmail(id: number): Observable<number> {
    return of(id).pipe(
      map((_response) => {
        return id;
      }),
      catchError(this.handleError)
    );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
