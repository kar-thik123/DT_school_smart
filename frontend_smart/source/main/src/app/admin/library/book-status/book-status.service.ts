import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { BookStatus } from './book-status.model';

@Injectable({
  providedIn: 'root',
})
export class BookStatusService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/book-status.json';

  // BehaviorSubject to manage and emit BookStatus data
  dataChange: BehaviorSubject<BookStatus[]> = new BehaviorSubject<BookStatus[]>(
    []
  );

  // Temporarily stores data from dialogs
  dialogData!: BookStatus;

  // Getter for current data
  get data(): BookStatus[] {
    return this.dataChange.value;
  }

  // Getter for dialog data
  getDialogData(): BookStatus {
    return this.dialogData;
  }

  /** GET: Fetch all book statuses */
  getBookStatuses(): Observable<BookStatus[]> {
    // Local mock data response
    return this.httpClient.get<BookStatus[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data); // Update dataChange with fetched data
        return data; // Return fetched data
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.get<BookStatus[]>(this.API_URL).pipe(
    //   map((data) => {
    //     this.dataChange.next(data); // Update dataChange with fetched data
    //     return data; // Return fetched data
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** POST: Add a new book status */
  addBookStatus(bookStatus: BookStatus): Observable<BookStatus> {
    // Local mock data response
    return of(bookStatus).pipe(
      map(() => {
        this.dialogData = bookStatus; // Store the added book status in dialogData
        return bookStatus; // Return the added book status
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.post<BookStatus>(this.API_URL, bookStatus).pipe(
    //   map(() => {
    //     this.dialogData = bookStatus; // Store the added book status in dialogData
    //     return bookStatus; // Return the added book status
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing book status */
  updateBookStatus(bookStatus: BookStatus): Observable<BookStatus> {
    // Local mock data response
    return of(bookStatus).pipe(
      map(() => {
        this.dialogData = bookStatus; // Store the updated book status in dialogData
        return bookStatus; // Return the updated book status
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.put<BookStatus>(`${this.API_URL}`, bookStatus).pipe(
    //   map(() => {
    //     this.dialogData = bookStatus; // Store the updated book status in dialogData
    //     return bookStatus; // Return the updated book status
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a book status by ID */
  deleteBookStatus(id: number): Observable<number> {
    // Local mock data response
    return of(id).pipe(
      map(() => {
        return id; // Return the ID of the deleted book status
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => {
    //     return id; // Return the ID of the deleted book status
    //   }),
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
