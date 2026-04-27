import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { FeesType } from './fees-type.model';

@Injectable({
  providedIn: 'root',
})
export class FeesTypeService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/fees-type.json';

  dataChange: BehaviorSubject<FeesType[]> = new BehaviorSubject<FeesType[]>([]);
  dialogData!: FeesType;

  get data(): FeesType[] {
    return this.dataChange.value;
  }

  getDialogData(): FeesType {
    return this.dialogData;
  }

  /** CRUD METHODS */

  /** GET: Fetch all fees types */
  getAllFeesTypes(): Observable<FeesType[]> {
    return this.httpClient.get<FeesType[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new fees type */
  addFeesType(feesType: FeesType): Observable<FeesType> {
    // Simulate adding the fees type
    return of(feesType).pipe(
      map((response) => {
        this.dialogData = feesType;
        return response; // Return the added fees type
      }),
      catchError(this.handleError)
    );

    // API call to add the fees type
    // return this.httpClient.post<FeesType>(this.API_URL, feesType).pipe(
    //   map(() => {
    //     this.dialogData = feesType;
    //     return feesType;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing fees type */
  updateFeesType(feesType: FeesType): Observable<FeesType> {
    // Simulate updating the fees type
    return of(feesType).pipe(
      map((response) => {
        this.dialogData = feesType;
        return response; // Return the updated fees type
      }),
      catchError(this.handleError)
    );

    // API call to update the fees type
    // return this.httpClient.put<FeesType>(`${this.API_URL}`, feesType).pipe(
    //   map(() => {
    //     this.dialogData = feesType;
    //     return feesType;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a fees type by ID */
  deleteFeesType(id: number): Observable<number> {
    // Simulate deleting the fees type by ID
    return of(id).pipe(
      map(() => {
        return id; // Return the ID of the deleted fees type
      }),
      catchError(this.handleError)
    );

    // API call to delete the fees type
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted fees type
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
