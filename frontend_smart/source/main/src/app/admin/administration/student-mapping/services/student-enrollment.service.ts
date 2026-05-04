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

  getEnrollments(params: any): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getUnenrolledStudents(academic_year_id: string, search?: string): Observable<any[]> {
    let params: any = { academic_year_id };
    if (search) {
      params.search = search;
    }
    return this.http.get<any[]>(`${this.apiUrl}/unenrolled`, { params });
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

  unassignStudent(student_id: string, academic_year_id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${student_id}/${academic_year_id}`);
  }
}
