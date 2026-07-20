import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProvisioningPayload, ProvisioningResponse, ReadinessStatus } from './organization.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/organizations`;

  provisionOrganization(payload: ProvisioningPayload): Observable<ProvisioningResponse> {
    console.log('--- SERVICE LAYER PAYLOAD LOGGING ---');
    console.log('payload.logo_url:', payload.logo_url);
    console.log('Full payload:', payload);
    return this.http.post<ProvisioningResponse>(this.apiUrl, payload);
  }

  validateProvisioning(payload: Partial<ProvisioningPayload>): Observable<ReadinessStatus> {
    return this.http.post<ReadinessStatus>(`${this.apiUrl}/validate-provisioning`, payload);
  }

  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ logoUrl: string }>(`${this.apiUrl}/upload-logo`, formData);
  }

  uploadSchoolProfile(file: File): Observable<{ profileUrl: string }> {
    const formData = new FormData();
    formData.append('profile', file);
    return this.http.post<{ profileUrl: string }>(`${this.apiUrl}/upload-school-profile`, formData);
  }

  getOrganizations(page: number = 1, limit: number = 10, search: string = '', sortBy: string = 'created_at', sortOrder: string = 'desc'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&limit=${limit}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getOrganizationById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  updateSettings(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/settings`, data);
  }



  checkSubdomainAvailability(subdomain: string): Observable<{ available: boolean }> {
    // Note: This endpoint should be added to backend for better UX
    return this.http.get<{ available: boolean }>(`${this.apiUrl}/check-subdomain?q=${subdomain}`);
  }

  testSmtpConnection(smtpConfig: any): Observable<{ success: boolean; message: string }> {
    // Note: This endpoint should be added to backend
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/test-smtp`, smtpConfig);
  }

  deleteOrganization(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getMyLicense(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me/license`);
  }
}
