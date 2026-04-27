import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { IRole, IPermission } from './role-permission.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RolePermissionService {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/roles`;

  dataChange: BehaviorSubject<IRole[]> = new BehaviorSubject<IRole[]>([]);

  getAllRoles(): Observable<IRole[]> {
    return this.httpClient.get<IRole[]>(this.baseUrl).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  getAvailablePermissions(): Observable<IPermission[]> {
    return this.httpClient.get<IPermission[]>(`${this.baseUrl}/available-permissions`).pipe(
      catchError(this.handleError)
    );
  }

  getRolePermissions(id: string): Observable<IPermission[]> {
    return this.httpClient.get<IPermission[]>(`${this.baseUrl}/${id}/permissions`).pipe(
      catchError(this.handleError)
    );
  }

  addRole(role: Partial<IRole>): Observable<IRole> {
    return this.httpClient.post<IRole>(this.baseUrl, role).pipe(
      catchError(this.handleError)
    );
  }

  syncPermissions(roleId: string, permissionIds: string[]): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/${roleId}/sync-permissions`, { permissionIds }).pipe(
      catchError(this.handleError)
    );
  }

  updateRole(id: string, role: Partial<IRole>): Observable<IRole> {
    return this.httpClient.put<IRole>(`${this.baseUrl}/${id}`, role).pipe(
      catchError(this.handleError)
    );
  }

  deleteRole(id: string): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  cloneRole(id: string, roleData: Partial<IRole>): Observable<IRole> {
    return this.httpClient.post<IRole>(`${this.baseUrl}/${id}/clone`, roleData).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Something went wrong; please try again later.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    console.error('An error occurred:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
