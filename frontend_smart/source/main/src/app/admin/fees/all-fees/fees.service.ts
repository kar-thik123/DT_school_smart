import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Fees } from './fees.model';

@Injectable({
  providedIn: 'root',
})
export class FeesService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/fees.json';
  dataChange: BehaviorSubject<Fees[]> = new BehaviorSubject<Fees[]>([]);

  /** CRUD METHODS */

  /** GET: Fetch all fees */
  getAllFees(): Observable<Fees[]> {
    return this.httpClient.get<Fees[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new fee */
  addFees(fees: Fees): Observable<Fees> {
    // Simulate adding the fee
    return of(fees).pipe(
      map((_response) => {
        return _response; // Return the added fee
      }),
      catchError(this.handleError)
    );

    // API call to add the fee
    // return this.httpClient.post<Fees>(this.API_URL, fees).pipe(
    //   map(() => fees), // Return the added fee
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing fee */
  updateFees(fees: Fees): Observable<Fees> {
    // Simulate updating the fee
    return of(fees).pipe(
      map((response) => {
        return response; // Return the updated fee
      }),
      catchError(this.handleError)
    );

    // API call to update the fee
    // return this.httpClient.put<Fees>(`${this.API_URL}`, fees).pipe(
    //   map(() => fees), // Return the updated fee
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a fee by ID */
  deleteFees(id: number): Observable<number> {
    // Simulate deleting the fee by ID
    return of(id).pipe(
      map((_response) => {
        return id; // Return the ID of the deleted fee
      }),
      catchError(this.handleError)
    );

    // API call to delete the fee
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted fee
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
