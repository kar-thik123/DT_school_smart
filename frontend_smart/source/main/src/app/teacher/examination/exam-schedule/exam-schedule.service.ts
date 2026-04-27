import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { ExamSchedule } from './exam-schedule.model';

@Injectable({
  providedIn: 'root',
})
export class ExamScheduleService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/examSchedule.json';
  dataChange: BehaviorSubject<ExamSchedule[]> = new BehaviorSubject<
    ExamSchedule[]
  >([]);

  /** CRUD METHODS */

  /** GET: Fetch all exam schedules */

  getAllExamSchedules(): Observable<ExamSchedule[]> {
    return this.httpClient.get<ExamSchedule[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );

    // Commented out actual API call for testing
    // return this.httpClient.get<ExamSchedule[]>(this.API_URL).pipe(
    //   map((data) => {
    //     this.dataChange.next(data); // Update the BehaviorSubject with the fetched data
    //     return data;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** POST: Add a new exam schedule */
  addExamSchedule(examSchedule: ExamSchedule): Observable<ExamSchedule> {
    // Mock response using `of()`
    return of(examSchedule).pipe(
      map(() => examSchedule), // Return the added exam schedule
      catchError(this.handleError)
    );

    // Commented out actual API call for testing
    // return this.httpClient.post<ExamSchedule>(this.API_URL, examSchedule).pipe(
    //   map((response) => {
    //     return examSchedule;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing exam schedule */
  updateExamSchedule(examSchedule: ExamSchedule): Observable<ExamSchedule> {
    // Mock response using `of()`
    return of(examSchedule).pipe(
      map(() => examSchedule), // Return the updated exam schedule
      catchError(this.handleError)
    );

    // Commented out actual API call for testing
    // return this.httpClient
    //   .put<ExamSchedule>(`${this.API_URL}`, examSchedule)
    //   .pipe(map((response) => examSchedule), catchError(this.handleError));
  }

  /** DELETE: Remove an exam schedule by ID */
  deleteExamSchedule(id: number): Observable<number> {
    // Mock response using `of()`
    return of(id).pipe(
      map(() => id), // Return the ID of the deleted exam schedule
      catchError(this.handleError)
    );

    // Commented out actual API call for testing
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
