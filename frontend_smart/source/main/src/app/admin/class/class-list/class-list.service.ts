import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { ClassList } from './class-list.model';

@Injectable({
  providedIn: 'root',
})
export class ClassListService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/class-list.json';
  dataChange: BehaviorSubject<ClassList[]> = new BehaviorSubject<ClassList[]>(
    []
  );

  /** CRUD METHODS */

  /** GET: Fetch all classes */
  getAllClasses(): Observable<ClassList[]> {
    return this.httpClient.get<ClassList[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new class */
  addClass(newClass: ClassList): Observable<ClassList> {
    // Add the new class to the data array
    return of(newClass).pipe(
      map((_response) => {
        return _response; // return the new class
      }),
      catchError(this.handleError)
    );

    // API call to add the class
    // return this.httpClient.post<ClassList>(this.API_URL, newClass).pipe(
    //   map(() => newClass), // Return the added class
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing class */
  updateClass(updatedClass: ClassList): Observable<ClassList> {
    // Update the class in the data array
    return of(updatedClass).pipe(
      map((response) => {
        return response; // return the updated class
      }),
      catchError(this.handleError)
    );

    // API call to update the class
    // return this.httpClient.put<ClassList>(`${this.API_URL}`, updatedClass).pipe(
    //   map(() => updatedClass), // Return the updated class
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a class by ID */
  deleteClass(id: number): Observable<number> {
    // Return the ID of the deleted class
    return of(id).pipe(
      map((_response) => {
        return id; // return the ID of the deleted class
      }),
      catchError(this.handleError)
    );

    // API call to delete the class
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted class
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
