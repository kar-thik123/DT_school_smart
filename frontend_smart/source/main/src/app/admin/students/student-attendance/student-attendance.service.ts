import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { StudentAttendance } from './student-attendance.model';

@Injectable({
  providedIn: 'root',
})
export class StudentAttendanceService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/student-attendance.json';
  dataChange: BehaviorSubject<StudentAttendance[]> = new BehaviorSubject<
    StudentAttendance[]
  >([]);

  dialogData!: StudentAttendance;

  // Getter for current data
  get data(): StudentAttendance[] {
    return this.dataChange.value;
  }

  // Getter for dialog data
  getDialogData(): StudentAttendance {
    return this.dialogData;
  }

  /** CRUD METHODS */

  /** GET: Fetch all student attendances */
  getAllStudentAttendances(): Observable<StudentAttendance[]> {
    // Local mock data response
    return this.httpClient.get<StudentAttendance[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data); // Update the BehaviorSubject with the new data
        return data; // Return the fetched data
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient
    //   .get<StudentAttendance[]>(this.API_URL)
    //   .pipe(catchError(this.handleError));
  }

  /** POST: Add a new student attendance */
  addStudentAttendance(
    studentAttendance: StudentAttendance
  ): Observable<StudentAttendance> {
    // Local mock data response
    return of(studentAttendance).pipe(
      map(() => studentAttendance), // Return the added student attendance
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient
    //   .post<StudentAttendance>(this.API_URL, studentAttendance)
    //   .pipe(
    //     map(() => studentAttendance), // Return the added student attendance
    //     catchError(this.handleError)
    //   );
  }

  /** PUT: Update an existing student attendance */
  updateStudentAttendance(
    studentAttendance: StudentAttendance
  ): Observable<StudentAttendance> {
    // Local mock data response
    return of(studentAttendance).pipe(
      map(() => studentAttendance), // Return the updated student attendance
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient
    //   .put<StudentAttendance>(`${this.API_URL}`, studentAttendance)
    //   .pipe(
    //     map(() => studentAttendance), // Return the updated student attendance
    //     catchError(this.handleError)
    //   );
  }

  /** DELETE: Remove a student attendance by ID */
  deleteStudentAttendance(id: number): Observable<number> {
    // Local mock data response
    return of(id).pipe(
      map(() => id), // Return the ID of the deleted student attendance
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted student attendance
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
