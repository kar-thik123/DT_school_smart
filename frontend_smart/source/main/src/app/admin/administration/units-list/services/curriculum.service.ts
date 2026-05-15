import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface ICurriculumUnit {
  id: string;
  name: string;
  grade_id: string;
  section_id: string;
  subject_id: string;
  order_index: number;
  created_at: string;
  grade?: { id: string; name: string };
  section?: { id: string; name: string };
  subject?: { id: string; name: string };
  _count?: { topics: number };
}

export interface ICurriculumTopic {
  id: string;
  name: string;
  unit_id: string;
  order_index: number;
  created_at: string;
  unit?: { id: string; name: string };
  _count?: { sub_topics: number };
}

export interface ICurriculumSubTopic {
  id: string;
  name: string;
  topic_id: string;
  order_index: number;
  created_at: string;
  topic?: { id: string; name: string };
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CurriculumService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/curriculum`;

  // --- Units ---
  getUnits(params?: any): Observable<IPaginatedResponse<ICurriculumUnit>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<IPaginatedResponse<ICurriculumUnit>>(`${this.API_URL}/units`, { params: httpParams });
  }

  createUnit(payload: Partial<ICurriculumUnit>): Observable<any> {
    return this.http.post(`${this.API_URL}/units`, payload);
  }

  updateUnit(id: string, payload: Partial<ICurriculumUnit>): Observable<any> {
    return this.http.patch(`${this.API_URL}/units/${id}`, payload);
  }

  deleteUnit(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/units/${id}`);
  }

  // --- Topics ---
  getTopics(params?: any): Observable<IPaginatedResponse<ICurriculumTopic>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<IPaginatedResponse<ICurriculumTopic>>(`${this.API_URL}/topics`, { params: httpParams });
  }

  createTopic(payload: Partial<ICurriculumTopic>): Observable<any> {
    return this.http.post(`${this.API_URL}/topics`, payload);
  }

  updateTopic(id: string, payload: Partial<ICurriculumTopic>): Observable<any> {
    return this.http.patch(`${this.API_URL}/topics/${id}`, payload);
  }

  deleteTopic(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/topics/${id}`);
  }

  // --- Sub Topics ---
  getSubTopics(params?: any): Observable<IPaginatedResponse<ICurriculumSubTopic>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<IPaginatedResponse<ICurriculumSubTopic>>(`${this.API_URL}/subtopics`, { params: httpParams });
  }

  createSubTopic(payload: Partial<ICurriculumSubTopic>): Observable<any> {
    return this.http.post(`${this.API_URL}/subtopics`, payload);
  }

  updateSubTopic(id: string, payload: Partial<ICurriculumSubTopic>): Observable<any> {
    return this.http.patch(`${this.API_URL}/subtopics/${id}`, payload);
  }

  deleteSubTopic(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/subtopics/${id}`);
  }
}
