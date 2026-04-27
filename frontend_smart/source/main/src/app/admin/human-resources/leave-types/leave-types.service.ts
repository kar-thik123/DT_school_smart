import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, map } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { LeaveTypes } from './leave-types.model';

@Injectable({
  providedIn: 'root',
})
export class LeaveTypesService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/leave-types.json';
  private dataChange: BehaviorSubject<LeaveTypes[]> = new BehaviorSubject<
    LeaveTypes[]
  >([]);

  get data(): LeaveTypes[] {
    return this.dataChange.value;
  }

  /** GET: Fetch all leave types */
  getAllLeaveTypes(): Observable<LeaveTypes[]> {
    return this.httpClient.get<LeaveTypes[]>(this.API_URL).pipe(
      map((leaveTypes) => {
        this.dataChange.next(leaveTypes); // Update the data change observable
        return leaveTypes;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new leave type */
  addLeaveType(leaveType: LeaveTypes): Observable<LeaveTypes> {
    // Simulate adding a new leave type
    return of(leaveType).pipe(
      map((_response) => {
        return leaveType; // Return the newly added leave type
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing leave type */
  updateLeaveType(leaveType: LeaveTypes): Observable<LeaveTypes> {
    // Simulate updating a leave type
    return of(leaveType).pipe(
      map((_response) => {
        return leaveType; // Return the updated leave type
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove a leave type by ID */
  deleteLeaveType(id: number): Observable<number> {
    // Simulate deleting a leave type
    return of(id).pipe(
      map((_response) => {
        return id; // Return the ID of the deleted leave type
      }),
      catchError(this.handleError)
    );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
