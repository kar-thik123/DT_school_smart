import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { NotificationSetting, INotificationSetting } from './notification-setting.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationSettingService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<NotificationSetting[]> = new BehaviorSubject<NotificationSetting[]>([]);

  private staticData: INotificationSetting[] = [
    { id: 1, notificationType: 'Attendance Alert', channel: 'SMS', recipients: 'Parents', frequency: 'Daily', template: 'Your child [Name] was absent today.', status: 'Active' },
    { id: 2, notificationType: 'Fee Reminder', channel: 'Email', recipients: 'Parents', frequency: 'Monthly', template: 'Dear Parent, Fee for [Month] is due.', status: 'Active' },
    { id: 3, notificationType: 'Exam Schedule', channel: 'Email', recipients: 'Students', frequency: 'Termly', template: 'Exam schedule for [Term] has been posted.', status: 'Active' },
    { id: 4, notificationType: 'Staff Meeting', channel: 'Internal', recipients: 'Teachers', frequency: 'Weekly', template: 'Staff meeting scheduled for [Date] at [Time].', status: 'Active' },
    { id: 5, notificationType: 'Holidays', channel: 'SMS', recipients: 'Everyone', frequency: 'Occasional', template: 'School will be closed on [Date] for [Event].', status: 'Active' },
    { id: 6, notificationType: 'Result Published', channel: 'SMS', recipients: 'Parents', frequency: 'Termly', template: 'Results for [Term] are now available online.', status: 'Active' },
    { id: 7, notificationType: 'Library Overdue', channel: 'Email', recipients: 'Students', frequency: 'Daily', template: 'Book [Title] is overdue. Please return it.', status: 'Active' },
    { id: 8, notificationType: 'Birthday Wishes', channel: 'Email', recipients: 'Students', frequency: 'Daily', template: 'Happy Birthday [Name]! Have a great day.', status: 'Inactive' },
    { id: 9, notificationType: 'Event Invitation', channel: 'SMS', recipients: 'Everyone', frequency: 'Occasional', template: 'We invite you to [Event] on [Date].', status: 'Active' },
    { id: 10, notificationType: 'Emergency Notice', channel: 'SMS/Email', recipients: 'Everyone', frequency: 'Urgent', template: 'Emergency: [Details]. Please stay safe.', status: 'Active' },
    { id: 11, notificationType: 'Assignment Posted', channel: 'Internal', recipients: 'Students', frequency: 'Daily', template: 'New assignment posted for [Subject].', status: 'Active' },
    { id: 12, notificationType: 'Transport Delay', channel: 'SMS', recipients: 'Route 5 Parents', frequency: 'Urgent', template: 'Bus Route 5 is delayed by 20 mins.', status: 'Active' },
    { id: 13, notificationType: 'PTM Reminder', channel: 'Email', recipients: 'Parents', frequency: 'Termly', template: 'PTM scheduled for [Date] to discuss progress.', status: 'Active' },
  ];

  getAllSettings(): Observable<NotificationSetting[]> {
    return of(this.staticData as NotificationSetting[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addSetting(setting: NotificationSetting): Observable<NotificationSetting> {
    return of(setting).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateSetting(setting: NotificationSetting): Observable<NotificationSetting> {
    return of(setting).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteSetting(id: number): Observable<number> {
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
