import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MasterEntity, OrganizationProfile } from './master-config.model';

@Injectable({
  providedIn: 'root',
})
export class MasterConfigService {
  private httpClient = inject(HttpClient);
  private readonly academicBaseUrl = `${environment.apiUrl}/academic`;
  private readonly orgBaseUrl = `${environment.apiUrl}/organizations`;

  // --- Organization Profile ---
  getOrganizationProfile(): Observable<OrganizationProfile> {
    // We'll add this endpoint to the backend next
    return this.httpClient.get<OrganizationProfile>(`${this.orgBaseUrl}/me/profile`).pipe(
      catchError(this.handleError)
    );
  }

  updateBranding(id: string, data: Partial<OrganizationProfile>): Observable<any> {
    return this.httpClient.patch(`${this.orgBaseUrl}/${id}/branding`, data).pipe(
      catchError(this.handleError)
    );
  }

  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.httpClient.post<{ logoUrl: string }>(`${this.orgBaseUrl}/upload-logo`, formData).pipe(
      catchError(this.handleError)
    );
  }

  // --- Generic Master CRUD ---
  getEntities(entityType: string): Observable<MasterEntity[]> {
    return this.httpClient.get<MasterEntity[]>(`${this.academicBaseUrl}/${entityType}`).pipe(
      catchError(this.handleError)
    );
  }

  createEntity(entityType: string, data: any): Observable<any> {
    return this.httpClient.post(`${this.academicBaseUrl}/${entityType}`, data).pipe(
      catchError(this.handleError)
    );
  }

  updateEntity(entityType: string, id: string, data: any): Observable<any> {
    return this.httpClient.put(`${this.academicBaseUrl}/${entityType}/${id}`, data).pipe(
      catchError(this.handleError)
    );
  }

  deleteEntity(entityType: string, id: string): Observable<any> {
    return this.httpClient.delete(`${this.academicBaseUrl}/${entityType}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- Settings CRUD ---
  getSettings(moduleName: string): Observable<any> {
    return this.httpClient.get<any>(`${environment.apiUrl}/settings/${moduleName}`).pipe(
      catchError(this.handleError)
    );
  }

  updateSettings(moduleName: string, configData: any): Observable<any> {
    return this.httpClient.put<any>(`${environment.apiUrl}/settings/${moduleName}`, { config_data: configData }).pipe(
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
