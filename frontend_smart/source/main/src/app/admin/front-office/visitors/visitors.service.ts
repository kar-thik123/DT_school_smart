import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Visitors } from './visitors.model';

@Injectable({
  providedIn: 'root',
})
export class VisitorsService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/visitors.json';

  dataChange: BehaviorSubject<Visitors[]> = new BehaviorSubject<Visitors[]>([]);
  dialogData!: Visitors;

  get data(): Visitors[] {
    return this.dataChange.value;
  }

  getDialogData(): Visitors {
    return this.dialogData;
  }

  /** CRUD METHODS */

  /** GET: Fetch visitors */
  getVisitors(): Observable<Visitors[]> {
    return this.httpClient.get<Visitors[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new visitor */
  addVisitor(visitor: Visitors): Observable<Visitors> {
    // Simulating the addition of a visitor
    return of(visitor).pipe(
      map((response) => {
        this.dialogData = visitor;
        return response; // Return the added visitor
      }),
      catchError(this.handleError)
    );

    // Uncomment for real API call
    // return this.httpClient.post<Visitors>(this.API_URL, visitor).pipe(
    //   map(() => {
    //     this.dialogData = visitor;
    //     return visitor;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing visitor */
  updateVisitor(visitor: Visitors): Observable<Visitors> {
    // Simulating the update of a visitor
    return of(visitor).pipe(
      map((response) => {
        this.dialogData = visitor;
        return response; // Return the updated visitor
      }),
      catchError(this.handleError)
    );

    // Uncomment for real API call
    // return this.httpClient.put<Visitors>(`${this.API_URL}`, visitor).pipe(
    //   map(() => {
    //     this.dialogData = visitor;
    //     return visitor;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a visitor by ID */
  deleteVisitor(id: number): Observable<number> {
    // Simulating the deletion of a visitor by ID
    return of(id).pipe(
      map(() => {
        return id; // Return the ID of the deleted visitor
      }),
      catchError(this.handleError)
    );

    // Uncomment for real API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => {
    //     return id;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** GET: Search visitors by name */
  searchByName(name: string): Observable<Visitors[]> {
    return this.httpClient.get<Visitors[]>(`${this.API_URL}?name=${name}`).pipe(
      map((data) => {
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** GET: Filter visitors by date range */
  filterByDateRange(startDate: Date, endDate: Date): Observable<Visitors[]> {
    return this.httpClient
      .get<Visitors[]>(
        `${
          this.API_URL
        }?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      .pipe(
        map((data) => {
          return data;
        }),
        catchError(this.handleError)
      );
  }

  /** GET: Filter visitors by purpose */
  filterByPurpose(purpose: string): Observable<Visitors[]> {
    return this.httpClient
      .get<Visitors[]>(`${this.API_URL}?purpose=${purpose}`)
      .pipe(
        map((data) => {
          return data;
        }),
        catchError(this.handleError)
      );
  }

  /** GET: Get today's visitors */
  getTodayVisitors(): Observable<Visitors[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.httpClient
      .get<Visitors[]>(`${this.API_URL}?date=${today}`)
      .pipe(
        map((data) => {
          return data;
        }),
        catchError(this.handleError)
      );
  }

  /** POST: Check out visitor */
  checkOutVisitor(visitorId: number, checkOutTime: Date): Observable<Visitors> {
    return this.httpClient
      .post<Visitors>(`${this.API_URL}/checkout`, {
        visitorId,
        checkOutTime: checkOutTime.toISOString(),
      })
      .pipe(
        map((data) => {
          return data;
        }),
        catchError(this.handleError)
      );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
