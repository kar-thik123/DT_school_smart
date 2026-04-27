import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Lectures } from './lectures.model';

@Injectable({
  providedIn: 'root',
})
export class LecturesService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/lectures.json';
  dataChange: BehaviorSubject<Lectures[]> = new BehaviorSubject<Lectures[]>([]);

  /** CRUD METHODS */

  /** GET: Fetch all lectures */

  getAllLectures(): Observable<Lectures[]> {
    return this.httpClient.get<Lectures[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new lecture */
  addLectures(lectures: Lectures): Observable<Lectures> {
    // Add the new department to the data array
    return of(lectures).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing lecture */
  updateLectures(lectures: Lectures): Observable<Lectures> {
    // Mock response using `of()`
    return of(lectures).pipe(
      map(() => lectures), // Return the updated lecture
      catchError(this.handleError)
    );

    // Commented out actual HTTP request for testing
    // return this.httpClient
    //   .put<Lectures>(`${this.API_URL}`, lectures)
    //   .pipe(map((response) => lectures), catchError(this.handleError));
  }

  /** DELETE: Remove a lecture by ID */
  deleteLectures(id: number): Observable<number> {
    // Mock response using `of()`
    return of(id).pipe(
      map(() => id), // Return the ID of the deleted lecture
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
