import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Students } from './students.model';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/students.json';
  dataChange: BehaviorSubject<Students[]> = new BehaviorSubject<Students[]>([]);

  dialogData!: Students;

  // Getter for current data
  get data(): Students[] {
    return this.dataChange.value;
  }

  // Getter for dialog data
  getDialogData(): Students {
    return this.dialogData;
  }

  /** CRUD METHODS */

  /** GET: Fetch all students */
  getAllStudents(): Observable<Students[]> {
    // Local mock data response
    return this.httpClient.get<Students[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data); // Update the BehaviorSubject with the new data
        return data; // Return the fetched data
      }),
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient
    //   .get<Students[]>(this.API_URL)
    //   .pipe(catchError(this.handleError));
  }

  /** POST: Add a new student */
  addStudent(student: Students): Observable<Students> {
    // Local mock data response
    return of(student).pipe(
      map(() => student), // Return the added student
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.post<Students>(this.API_URL, student).pipe(
    //   map(() => student), // Return the added student
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing student */
  updateStudent(student: Students): Observable<Students> {
    // Local mock data response
    return of(student).pipe(
      map(() => student), // Return the updated student
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.put<Students>(`${this.API_URL}`, student).pipe(
    //   map(() => student), // Return the updated student
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a student by ID */
  deleteStudent(id: number): Observable<number> {
    // Local mock data response
    return of(id).pipe(
      map(() => id), // Return the ID of the deleted student
      catchError(this.handleError)
    );

    // Commented API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted student
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
