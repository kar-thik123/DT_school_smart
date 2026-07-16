import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IUser, LicenseInfo } from './user-management.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private readonly orgUrl = `${environment.apiUrl}/organizations`;

  dataChange: BehaviorSubject<IUser[]> = new BehaviorSubject<IUser[]>([]);

  get data(): IUser[] {
    return this.dataChange.value;
  }

  getAllUsers(): Observable<IUser[]> {
    return this.httpClient.get<IUser[]>(this.baseUrl).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addUser(user: Partial<IUser>): Observable<IUser> {
    return this.httpClient.post<IUser>(this.baseUrl, user).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(id: string, user: Partial<IUser>): Observable<IUser> {
    return this.httpClient.put<IUser>(`${this.baseUrl}/${id}`, user).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: string): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateUserStatus(id: string, is_active: boolean): Observable<any> {
    return this.httpClient.patch(`${this.baseUrl}/${id}/status`, { is_active }).pipe(
      catchError(this.handleError)
    );
  }

  getLicenseInfo(): Observable<LicenseInfo> {
    return this.httpClient.get<LicenseInfo>(`${this.orgUrl}/me/license`).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(id: string): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/${id}/reset-password`, {}).pipe(
      catchError(this.handleError)
    );
  }

  analyzeBulkImport(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post(`${environment.apiUrl}/bulk-import/users/analyze`, formData).pipe(
      catchError(this.handleError)
    );
  }

  commitBulkImport(payload: any): Observable<any> {
    return this.httpClient.post(`${environment.apiUrl}/bulk-import/users/commit`, payload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Something went wrong; please try again later.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 400 || error.status === 409) {
        errorMessage = error.error?.message || 'Duplicate entry or invalid data provided.';
      } else if (error.status >= 500) {
        errorMessage = 'Sorry for the issue, server encountered an error. Please try again.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
