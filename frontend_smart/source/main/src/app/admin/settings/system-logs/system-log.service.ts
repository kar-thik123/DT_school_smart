import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { SystemLog, ISystemLog } from './system-log.model';

@Injectable({
  providedIn: 'root',
})
export class SystemLogService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<SystemLog[]> = new BehaviorSubject<SystemLog[]>([]);

  private staticData: ISystemLog[] = [
    { id: 1, timestamp: '2024-12-25 10:00:05', user: 'admin_john', activity: 'User Login', module: 'Auth', ipAddress: '192.168.1.1', severity: 'Info', status: 'Success' },
    { id: 2, timestamp: '2024-12-25 10:05:12', user: 'sarah_m', activity: 'Updated Profile', module: 'Settings', ipAddress: '192.168.1.5', severity: 'Info', status: 'Success' },
    { id: 3, timestamp: '2024-12-25 10:10:45', user: 'mike_j', activity: 'Deleted Report', module: 'Reports', ipAddress: '192.168.1.10', severity: 'Warning', status: 'Success' },
    { id: 4, timestamp: '2024-12-25 10:15:30', user: 'system', activity: 'Database Backup', module: 'System', ipAddress: 'localhost', severity: 'Info', status: 'Success' },
    { id: 5, timestamp: '2024-12-25 10:20:20', user: 'admin_john', activity: 'Bulk Upload Failure', module: 'Registration', ipAddress: '192.168.1.1', severity: 'Error', status: 'Failed' },
    { id: 6, timestamp: '2024-12-25 10:25:55', user: 'emily_d', activity: 'Generated Fee Invoice', module: 'Finance', ipAddress: '192.168.1.12', severity: 'Info', status: 'Success' },
    { id: 7, timestamp: '2024-12-25 10:30:10', user: 'lisa_b', activity: 'Role Permission Change', module: 'Security', ipAddress: '192.168.1.15', severity: 'Alert', status: 'Success' },
    { id: 8, timestamp: '2024-12-25 10:35:40', user: 'will_c', activity: 'Cleared Cache', module: 'Maintenance', ipAddress: '192.168.1.20', severity: 'Info', status: 'Success' },
    { id: 9, timestamp: '2024-12-25 10:40:05', user: 'system', activity: 'Mail Server Error', module: 'Communication', ipAddress: 'localhost', severity: 'Error', status: 'Failed' },
    { id: 10, timestamp: '2024-12-25 10:45:22', user: 'amanda_l', activity: 'Exam Marks Entry', module: 'Academics', ipAddress: '192.168.1.25', severity: 'Info', status: 'Success' },
    { id: 11, timestamp: '2024-12-25 10:50:35', user: 'admin_john', activity: 'Attempted Unauthorized Access', module: 'Admin', ipAddress: '192.168.1.1', severity: 'Critical', status: 'Blocked' },
    { id: 12, timestamp: '2024-12-25 10:55:50', user: 'jess_k', activity: 'Created New Class', module: 'Academics', ipAddress: '192.168.1.30', severity: 'Info', status: 'Success' },
    { id: 13, timestamp: '2024-12-25 11:00:15', user: 'matt_h', activity: 'Exported Student List', module: 'Reports', ipAddress: '192.168.1.35', severity: 'Info', status: 'Success' },
  ];

  getAllLogs(): Observable<SystemLog[]> {
    return of(this.staticData as SystemLog[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addLog(log: SystemLog): Observable<SystemLog> {
    return of(log).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateLog(log: SystemLog): Observable<SystemLog> {
    return of(log).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteLog(id: number): Observable<number> {
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
