import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Department } from './department.model';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/department.json';
  dataChange: BehaviorSubject<Department[]> = new BehaviorSubject<Department[]>(
    []
  );

  /** GET: Fetch all departments */
  getAllDepartments(): Observable<Department[]> {
    return this.httpClient.get<Department[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new department */
  addDepartment(department: Department): Observable<Department> {
    // Add the new department to the data array
    return of(department).pipe(
      map((response) => {
        return response; // return the added department
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing department */
  updateDepartment(department: Department): Observable<Department> {
    // Update the department in the data array
    return of(department).pipe(
      map((response) => {
        return response; // return updated department
      }),
      catchError(this.handleError)
    );

    // API call to update the department
    // return this.httpClient.put<Department>(`${this.API_URL}`, department).pipe(
    //   map(() => department), // return department from API
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a department by ID */
  deleteDepartment(id: number): Observable<number> {
    // Return the ID of the deleted department
    return of(id).pipe(
      map((_response) => {
        return id; // return the ID of the deleted department
      }),
      catchError(this.handleError)
    );

    // API call to delete the department
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // return the ID of the deleted department
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
