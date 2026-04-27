import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Homework } from './homework.model';

@Injectable({
  providedIn: 'root',
})
export class HomeworkService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/stdHomework.json';

  dataChange: BehaviorSubject<Homework[]> = new BehaviorSubject<Homework[]>([]);

  /** CRUD METHODS */

  /** GET: Fetch all homework */
  getAllHomework(): Observable<Homework[]> {
    // Mock response using `of()`
    return this.httpClient.get<Homework[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );

    // Commented out API call
    // return this.httpClient
    //   .get<Homework[]>(this.API_URL)
    //   .pipe(catchError(this.handleError));
  }

  /** POST: Add a new homework */
  addHomework(homework: Homework): Observable<Homework> {
    // Mock response using `of()`
    return of(homework).pipe(
      map(() => homework),
      catchError(this.handleError)
    );

    // Commented out API call
    // return this.httpClient
    //   .post<Homework>(this.API_URL, homework)
    //   .pipe(map((response) => homework), catchError(this.handleError));
  }

  /** PUT: Update an existing homework */
  updateHomework(homework: Homework): Observable<Homework> {
    // Mock response using `of()`
    return of(homework).pipe(
      map(() => homework),
      catchError(this.handleError)
    );

    // Commented out API call
    // return this.httpClient
    //   .put<Homework>(`${this.API_URL}`, homework)
    //   .pipe(map(() => homework), catchError(this.handleError));
  }

  /** DELETE: Remove a homework by ID */
  deleteHomework(id: number): Observable<number> {
    // Mock response using `of()`
    return of(id).pipe(
      map(() => id),
      catchError(this.handleError)
    );

    // Commented out API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted homework
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
