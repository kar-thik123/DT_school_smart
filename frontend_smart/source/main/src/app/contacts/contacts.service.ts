import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Contacts } from './contacts.model';

@Injectable({
  providedIn: 'root',
})
export class ContactsService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/contacts.json';

  /** GET: Fetch all contacts */
  getAllContacts(): Observable<Contacts[]> {
    return this.httpClient
      .get<Contacts[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  /** POST: Add a new contact */
  addContact(contact: Contacts): Observable<Contacts> {
    // Add the new contact to the data array (simulating the API call)
    return of(contact).pipe(
      map((_response) => {
        return contact; // Return the same contact object
      }),
      catchError(this.handleError)
    );

    // API call to add the contact
    // return this.httpClient.post<Contacts>(this.API_URL, contact).pipe(
    //   map(() => {
    //     return contact; // return the newly added contact
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing contact */
  updateContact(contact: Contacts): Observable<Contacts> {
    // Update the contact in the data array (simulating the API call)
    return of(contact).pipe(
      map((_response) => {
        return contact; // Return the updated contact object
      }),
      catchError(this.handleError)
    );

    // API call to update the contact
    // return this.httpClient.put<Contacts>(`${this.API_URL}`, contact).pipe(
    //   map(() => {
    //     return contact; // return the updated contact
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a contact by ID */
  deleteContact(id: number): Observable<number> {
    // Remove the contact by ID from the data array (simulating the API call)
    return of(id).pipe(
      map((_response) => {
        return id; // Return the ID of the deleted contact
      }),
      catchError(this.handleError)
    );

    // API call to delete the contact
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => {
    //     return id; // return the ID of the deleted contact
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
