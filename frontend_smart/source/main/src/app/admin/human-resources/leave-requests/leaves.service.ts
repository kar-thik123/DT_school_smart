import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, map } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Leaves } from './leaves.model';

@Injectable({
  providedIn: 'root',
})
export class LeavesService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/leaves.json';

  /** GET: Fetch all leaves */
  getAllLeaves(): Observable<Leaves[]> {
    return this.httpClient
      .get<Leaves[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  /** POST: Add a new leave */
  addLeaves(leaves: Leaves): Observable<Leaves> {
    // Simulate adding the leave to the local data array
    return of(leaves).pipe(
      map((_response) => {
        return leaves; // return the newly added leave
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing leave */
  updateLeaves(leaves: Leaves): Observable<Leaves> {
    // Simulate updating the leave in the local data array
    return of(leaves).pipe(
      map((_response) => {
        return leaves; // return the updated leave
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove a leave by ID */
  deleteLeaves(id: number): Observable<number> {
    // Simulate deleting the leave from the local data array
    return of(id).pipe(
      map((_response) => {
        return id; // return the ID of the deleted leave
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
