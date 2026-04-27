import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { FeesDiscount } from './fees-discount..model';

@Injectable({
  providedIn: 'root',
})
export class FeesDiscountService {
  private httpClient = inject(HttpClient);
  private readonly API_URL = 'assets/data/fees-discount.json';

  dataChange: BehaviorSubject<FeesDiscount[]> = new BehaviorSubject<
    FeesDiscount[]
  >([]);
  dialogData!: FeesDiscount;

  get data(): FeesDiscount[] {
    return this.dataChange.value;
  }

  getDialogData(): FeesDiscount {
    return this.dialogData;
  }

  /** CRUD METHODS */

  /** GET: Fetch all fees discounts */
  getAllFeesDiscounts(): Observable<FeesDiscount[]> {
    return this.httpClient.get<FeesDiscount[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new fees discount */
  addFeesDiscount(feesDiscount: FeesDiscount): Observable<FeesDiscount> {
    // Simulate adding the fees discount
    return of(feesDiscount).pipe(
      map((response) => {
        this.dialogData = feesDiscount;
        return response; // Return the added fees discount
      }),
      catchError(this.handleError)
    );

    // API call to add the fees discount
    // return this.httpClient.post<FeesDiscount>(this.API_URL, feesDiscount).pipe(
    //   map(() => {
    //     this.dialogData = feesDiscount;
    //     return feesDiscount;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing fees discount */
  updateFeesDiscount(feesDiscount: FeesDiscount): Observable<FeesDiscount> {
    // Simulate updating the fees discount
    return of(feesDiscount).pipe(
      map((response) => {
        this.dialogData = feesDiscount;
        return response; // Return the updated fees discount
      }),
      catchError(this.handleError)
    );

    // API call to update the fees discount
    // return this.httpClient.put<FeesDiscount>(`${this.API_URL}`, feesDiscount).pipe(
    //   map(() => {
    //     this.dialogData = feesDiscount;
    //     return feesDiscount;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a fees discount by ID */
  deleteFeesDiscount(id: number): Observable<number> {
    // Simulate deleting the fees discount by ID
    return of(id).pipe(
      map(() => {
        return id; // Return the ID of the deleted fees discount
      }),
      catchError(this.handleError)
    );

    // API call to delete the fees discount
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted fees discount
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
