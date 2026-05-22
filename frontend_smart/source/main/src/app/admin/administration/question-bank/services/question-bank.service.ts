import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../src/environments/environment';

export interface IQuestion {
  id: string;
  organization_id: string;
  created_by: string;
  grade_id?: string | null;
  section_id?: string | null;
  subject_id?: string | null;
  unit_id?: string | null;
  topic_id?: string | null;
  sub_topic_id?: string | null;
  question_text: string;
  type: string;
  answer?: string;
  answer_config?: any;
  marks: number;
  difficulty: string;
  is_important: boolean;
  is_repeated?: boolean;
  created_at: Date;
  subject?: any;
  unit?: any;
  topic?: any;
  creator?: any;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionBankService {
  private readonly API_URL = `${environment.apiUrl}/question-bank`;

  constructor(private http: HttpClient) { }

  getQuestions(filters?: any): Observable<IQuestion[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<IQuestion[]>(this.API_URL, { params });
  }

  createQuestion(question: Partial<IQuestion>): Observable<{ message: string; question: IQuestion }> {
    return this.http.post<{ message: string; question: IQuestion }>(this.API_URL, question);
  }

  uploadBulkCsvPreview(file: File): Observable<{ message: string; session_id: string; summary: any; records: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; session_id: string; summary: any; records: any[] }>(`${this.API_URL}/bulk/preview`, formData);
  }

  discardBulkImport(session_id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk/discard`, { session_id });
  }

  confirmBulkImport(session_id: string, modifiedRecords?: any[]): Observable<{ message: string; results?: any }> {
    return this.http.post<{ message: string; results?: any }>(`${this.API_URL}/bulk/confirm`, { session_id, modified_records: modifiedRecords });
  }

  // legacy direct bulk route
  uploadBulkCsv(file: File): Observable<{ message: string; results?: any }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; results?: any }>(`${this.API_URL}/bulk`, formData);
  }

  updateQuestion(id: string, question: Partial<IQuestion>): Observable<{ message: string; question: IQuestion }> {
    return this.http.put<{ message: string; question: IQuestion }>(`${this.API_URL}/${id}`, question);
  }

  deleteQuestion(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }
}
