import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Teachers } from './teachers.model';

@Injectable({
  providedIn: 'root',
})
export class TeachersService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/teachers.json';
  dataChange: BehaviorSubject<Teachers[]> = new BehaviorSubject<Teachers[]>([]);

  /** GET: Fetch all teachers */
  getAllTeachers(): Observable<Teachers[]> {
    // Local mock data response
    return this.httpClient.get<Teachers[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data); // Update the BehaviorSubject with the new data
        return data; // Return the fetched data
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient
    //   .get<Teachers[]>(this.API_URL)
    //   .pipe(catchError(this.handleError));
  }

  /** POST: Add a new teacher */
  addTeacher(teacher: Teachers): Observable<Teachers> {
    // Local mock data response
    return of(teacher).pipe(
      map(() => teacher), // Return the added teacher
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient
    //   .post<Teachers>(this.API_URL, teacher)
    //   .pipe(
    //     map((response) => teacher), // Return teacher from API
    //     catchError(this.handleError)
    //   );
  }

  /** PUT: Update an existing teacher */
  updateTeacher(teacher: Teachers): Observable<Teachers> {
    // Local mock data response
    return of(teacher).pipe(
      map(() => teacher), // Return the updated teacher
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient
    //   .put<Teachers>(`${this.API_URL}`, teacher)
    //   .pipe(
    //     map((response) => teacher), // Return teacher from API
    //     catchError(this.handleError)
    //   );
  }

  /** DELETE: Remove a teacher by ID */
  deleteTeacher(id: number): Observable<number> {
    // Local mock data response
    return of(id).pipe(
      map(() => id), // Return the ID of the deleted teacher
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted teacher
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
