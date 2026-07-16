import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentEnrollmentService {
  private apiUrl = `${environment.apiUrl}/student-enrollments`;

  constructor(private http: HttpClient) {}

  getEnrollments(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  getUnenrolledStudents(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unenrolled`, { params });
  }

  mapStudent(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/map`, payload);
  }

  bulkEnroll(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bulk-enroll`, payload);
  }

  promoteStudents(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/promote`, payload);
  }

  unassignStudent(student_id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${student_id}/_frontend_dummy_year_id`);
  }

  updateEnrollment(id: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  transferStudent(id: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/transfer`, payload);
  }

  withdrawStudent(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/withdraw`, payload);
  }

  activateStudent(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/activate`, {});
  }

  exportEnrollments(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, { responseType: 'blob' });
  }

  analyzeBulkImport(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${environment.apiUrl}/bulk-import/STUDENT_ENROLLMENT/analyze`, formData);
  }

  commitBulkImport(validRows: any[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/bulk-import/STUDENT_ENROLLMENT/commit`, { validRows });
  }
}
