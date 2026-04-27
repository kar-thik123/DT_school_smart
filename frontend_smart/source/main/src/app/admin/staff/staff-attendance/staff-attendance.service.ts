import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { StaffAttendance } from './staff-attendance.model';

@Injectable({
  providedIn: 'root',
})
export class StaffAttendanceService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/staff-attendance.json';
  dataChange: BehaviorSubject<StaffAttendance[]> = new BehaviorSubject<
    StaffAttendance[]
  >([]);

  /** CRUD METHODS */

  /** GET: Fetch all staff attendance records */
  getAllStaffAttendances(): Observable<StaffAttendance[]> {
    // Local mock data response
    return this.httpClient.get<StaffAttendance[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data); // Update the BehaviorSubject with the new data
        return data; // Return the fetched data
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.get<StaffAttendance[]>(this.API_URL).pipe(
    //   map((data) => {
    //     this.dataChange.next(data); // Update the BehaviorSubject with the new data
    //     return data; // Return the fetched data
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** POST: Add a new staff attendance record */
  addStaffAttendance(attendance: StaffAttendance): Observable<StaffAttendance> {
    // Simulate adding staff attendance
    return of(attendance).pipe(
      map((_response) => {
        return attendance; // Return the added attendance data
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing staff attendance data */
  updateStaffAttendance(
    attendance: StaffAttendance
  ): Observable<StaffAttendance> {
    // Simulate updating staff attendance
    return of(attendance).pipe(
      map((_response) => {
        return attendance; // Return the updated attendance data
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove a staff attendance record by ID */
  deleteStaffAttendance(id: number): Observable<number> {
    // Local mock data response
    return of(id).pipe(
      map(() => {
        return id; // Return the ID of the deleted attendance record
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => {
    //     return id; // Return the ID of the deleted attendance record
    //   }),
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
