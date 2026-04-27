import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { LeaveRequest } from './leave-request.model'; // Ensure the correct file path
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { UnsubscribeOnDestroyAdapter } from '@shared';

@Injectable({
  providedIn: 'root',
})
export class LeaveRequestService extends UnsubscribeOnDestroyAdapter {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/stdLeaveReq.json';
  isTblLoading = true;
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

    // Commented out actual API call for testing
    // return this.httpClient
    //   .get<LeaveRequest[]>(this.API_URL)
    //   .pipe(catchError(this.handleError));
  }

  /** POST: Add a new leave request */
  addLeaveRequest(leaveRequest: LeaveRequest): Observable<LeaveRequest> {
    // Mock response using `of()`
    return of(leaveRequest).pipe(
      map(() => leaveRequest),
      catchError(this.handleError)
    );

    // Commented out actual API call for testing
    // return this.httpClient
    //   .post<LeaveRequest>(this.API_URL, leaveRequest)
    //   .pipe(map((response) => leaveRequest), catchError(this.handleError));
  }

  /** PUT: Update an existing leave request */
  updateLeaveRequest(leaveRequest: LeaveRequest): Observable<LeaveRequest> {
    // Mock response using `of()`
    return of(leaveRequest).pipe(
      map(() => leaveRequest),
      catchError(this.handleError)
    );

    // Commented out actual API call for testing
    // return this.httpClient
    //   .put<LeaveRequest>(`${this.API_URL}`, leaveRequest)
    //   .pipe(map(() => leaveRequest), catchError(this.handleError));
  }

  /** DELETE: Remove a leave request by ID */
  deleteLeaveRequest(id: number): Observable<boolean> {
    // Mock response using `of()`
    return of(true).pipe(
      catchError(this.handleError)
    );

    // Commented out actual API call for testing
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => true), // Return true on success
    //   catchError(this.handleError)
    // );
  }

  /** Handle HTTP errors */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
