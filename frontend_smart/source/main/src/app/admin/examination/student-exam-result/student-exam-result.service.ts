import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface StudentExamSubjectResult {
  id?: string;
  subject_id: string;
  max_marks: number;
  obtained_marks: number;
  pass_marks?: number;
  is_absent?: boolean;
  status?: 'PASS' | 'FAIL' | 'WITHHELD';
  grade?: string;
  remarks?: string;
  subject?: any; // To hold the subject object for display
}

export interface StudentExamResult {
  id?: string;
  examination_id: string;
  student_id: string;
  grade_id: string;
  section_id?: string;
  total_max_marks?: number;
  total_obtained_marks?: number;
  percentage?: number;
  result_status?: 'PASS' | 'FAIL' | 'WITHHELD';
  grade?: string;
  remarks?: string;
  subject_results?: StudentExamSubjectResult[];
  
  // Display fields from backend relations
  examination?: any;
  student?: any;
  grade_rel?: any;
  section?: any;
  creator?: any;
  modifier?: any;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StudentExamResultService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/student-exam-results`;

  constructor() { }

  getAllResults(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getResultById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createResult(data: Partial<StudentExamResult>): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateResult(id: string, data: Partial<StudentExamResult>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteResult(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Helper methods to load dropdown data
  getExaminations(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/examinations`);
  }

  getGrades(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/academic/grades`);
  }

  getSections(gradeId?: string): Observable<any> {
    let url = `${environment.apiUrl}/academic/sections`;
    if (gradeId) url += `?grade_id=${gradeId}`;
    return this.http.get<any>(url);
  }

  getStudents(gradeId: string, sectionId?: string): Observable<any> {
    let url = `${environment.apiUrl}/student-enrollments?grade_id=${gradeId}`;
    if (sectionId) url += `&section_id=${sectionId}`;
    return this.http.get<any>(url);
  }

  getSubjects(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/academic/subjects`);
  }

  getSubjectGroups(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/academic/subject-groups`);
  }
}
