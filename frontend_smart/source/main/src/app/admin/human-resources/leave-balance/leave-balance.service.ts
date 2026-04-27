import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, map } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { LeaveBalance } from './leave-balance.model';

@Injectable({
  providedIn: 'root',
})
export class LeaveBalanceService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/leave-balance.json';
  private dataChange: BehaviorSubject<LeaveBalance[]> = new BehaviorSubject<
    LeaveBalance[]
  >([]);

  get data(): LeaveBalance[] {
    return this.dataChange.value;
  }

  /** GET: Fetch all leave balances */
  getAllLeaveBalances(): Observable<LeaveBalance[]> {
    return this.httpClient
      .get<LeaveBalance[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  /** POST: Add a new leave balance */
  addLeaveBalance(leaveBalance: LeaveBalance): Observable<LeaveBalance> {
    // Simulate adding the leave balance to the local data array
    return of(leaveBalance).pipe(
      map((_response) => {
        return leaveBalance; // return the newly added leave balance
      }),
      catchError(this.handleError)
    );

    // API call to add the leave balance
    // return this.httpClient
    //   .post<LeaveBalance>(this.API_URL, leaveBalance)
    //   .pipe(
    //     map(() => {
    //       return leaveBalance; // return the newly added leave balance
    //     }),
    //     catchError(this.handleError)
    //   );
  }

  /** PUT: Update an existing leave balance */
  updateLeaveBalance(leaveBalance: LeaveBalance): Observable<LeaveBalance> {
    // Simulate updating the leave balance in the local data array
    return of(leaveBalance).pipe(
      map((response) => {
        return response; // return the updated leave balance
      }),
      catchError(this.handleError)
    );

    // API call to update the leave balance
    // return this.httpClient
    //   .put<LeaveBalance>(`${this.API_URL}`, leaveBalance)
    //   .pipe(
    //     map(() => {
    //       return leaveBalance; // return the updated leave balance
    //     }),
    //     catchError(this.handleError)
    //   );
  }

  /** DELETE: Remove a leave balance by ID */
  deleteLeaveBalance(id: number): Observable<number> {
    // Simulate deleting the leave balance from the local data array
    return of(id).pipe(
      map((_response) => {
        return id; // return the ID of the deleted leave balance
      }),
      catchError(this.handleError)
    );

    // API call to delete the leave balance
    // return this.httpClient
    //   .delete<void>(`${this.API_URL}`)
    //   .pipe(
    //     map(() => {
    //       return id; // return the ID of the deleted leave balance
    //     }),
    //     catchError(this.handleError)
    //   );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
