import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, map } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { TodaysAttendance } from './todays-attendance..model';

@Injectable({
  providedIn: 'root',
})
export class TodaysAttendanceService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/todays-attendance.json';
  private dataChange: BehaviorSubject<TodaysAttendance[]> = new BehaviorSubject<
    TodaysAttendance[]
  >([]);

  get data(): TodaysAttendance[] {
    return this.dataChange.value;
  }

  /** GET: Fetch all today's attendance data */
  getAllTodays(): Observable<TodaysAttendance[]> {
    return this.httpClient.get<TodaysAttendance[]>(this.API_URL).pipe(
      map((todays) => {
        this.dataChange.next(todays); // Update the data change observable
        return todays;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new today's attendance data */
  addToday(todaysAttendance: TodaysAttendance): Observable<TodaysAttendance> {
    // Simulate adding today's attendance
    return of(todaysAttendance).pipe(
      map((_response) => {
        return todaysAttendance; // Return the newly added attendance data
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing today's attendance data */
  updateToday(
    todaysAttendance: TodaysAttendance
  ): Observable<TodaysAttendance> {
    // Simulate updating today's attendance
    return of(todaysAttendance).pipe(
      map((_response) => {
        return todaysAttendance; // Return the updated attendance data
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove today's attendance data by ID */
  deleteToday(id: number): Observable<number> {
    // Simulate deleting today's attendance
    return of(id).pipe(
      map((_response) => {
        return id; // Return the ID of the deleted attendance
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
