import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Staff } from './staff.model';

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/staff.json';
  dataChange: BehaviorSubject<Staff[]> = new BehaviorSubject<Staff[]>([]);

  dialogData!: Staff;

  // Getter for current data
  get data(): Staff[] {
    return this.dataChange.value;
  }

  // Getter for dialog data
  getDialogData(): Staff {
    return this.dialogData;
  }

  /** CRUD METHODS */

  /** GET: Fetch all staff */
  getAllStaff(): Observable<Staff[]> {
    // Local mock data response
    return this.httpClient.get<Staff[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data); // Update dataChange with fetched data
        return data; // Return fetched data
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.get<Staff[]>(this.API_URL).pipe(
    //   map((data) => {
    //     this.dataChange.next(data); // Update dataChange with fetched data
    //     return data; // Return fetched data
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** POST: Add a new staff member */
  addStaff(staff: Staff): Observable<Staff> {
    // Local mock data response
    return of(staff).pipe(
      map(() => staff), // Return the added staff member
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.post<Staff>(this.API_URL, staff).pipe(
    //   map(() => staff), // Return the added staff member
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing staff member */
  updateStaff(staff: Staff): Observable<Staff> {
    // Local mock data response
    return of(staff).pipe(
      map(() => staff), // Return the updated staff member
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.put<Staff>(`${this.API_URL}`, staff).pipe(
    //   map(() => staff), // Return the updated staff member
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a staff member by ID */
  deleteStaff(id: number): Observable<number> {
    // Local mock data response
    return of(id).pipe(
      map(() => id), // Return the ID of the deleted staff member
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted staff member
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
