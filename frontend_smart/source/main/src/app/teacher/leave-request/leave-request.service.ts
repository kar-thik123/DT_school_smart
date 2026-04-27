import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { LeaveRequest } from './leave-request.model';

@Injectable({
  providedIn: 'root',
})
export class LeaveRequestService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/teacher-leave.json';
  dataChange: BehaviorSubject<LeaveRequest[]> = new BehaviorSubject<
    LeaveRequest[]
  >([]);

  /** CRUD METHODS */

  /** GET: Fetch all leave requests */

  getAllLeaveRequests(): Observable<LeaveRequest[]> {
    return this.httpClient.get<LeaveRequest[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new leave request */
  addLeaveRequest(leaveRequest: LeaveRequest): Observable<LeaveRequest> {
    // Mock response using `of()`
    return of(leaveRequest).pipe(
      map(() => leaveRequest), // Return the added leave request
      catchError(this.handleError)
    );

    // Commented out actual HTTP request for testing
    // return this.httpClient.post<LeaveRequest>(this.API_URL, leaveRequest).pipe(
    //   map((response) => leaveRequest),
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing leave request */
  updateLeaveRequest(leaveRequest: LeaveRequest): Observable<LeaveRequest> {
    // Mock response using `of()`
    return of(leaveRequest).pipe(
      map(() => leaveRequest), // Return the updated leave request
      catchError(this.handleError)
    );

    // Commented out actual HTTP request for testing
    // return this.httpClient
    //   .put<LeaveRequest>(`${this.API_URL}`, leaveRequest)
    //   .pipe(map((response) => leaveRequest), catchError(this.handleError));
  }

  /** DELETE: Remove a leave request by ID */
  deleteLeaveRequest(id: number): Observable<number> {
    // Mock response using `of()`
    return of(id).pipe(
      map(() => id), // Return the ID of the deleted leave request
      catchError(this.handleError)
    );

    // Commented out actual HTTP request for testing
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id),
    //   catchError(this.handleError)
    // );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
