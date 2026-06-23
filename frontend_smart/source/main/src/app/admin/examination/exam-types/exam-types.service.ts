import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Examination {
  id?: string;
  exam_name: string;
  organization_id?: string;
  academic_year_id?: string;
  creator?: { id: string, name: string, email: string };
  modifier?: { id: string, name: string, email: string };
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExamTypesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/examinations`;

  constructor() { }

  getAllExaminations(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getExaminationById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createExamination(data: Partial<Examination>): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateExamination(id: string, data: Partial<Examination>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteExamination(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
