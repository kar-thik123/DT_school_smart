import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface IGrade {
  id: string;
  name: string;
  academic_year_id: string;
  organization_id: string;
  sort_order: number;
  is_active: boolean;
}

export interface ISection {
  id: string;
  name: string;
  grade_id: string;
  organization_id: string;
  sort_order: number;
  is_active: boolean;
}

export interface ISubject {
  id: string;
  name: string;
  grade_id: string;
  organization_id: string;
  sort_order: number;
  is_active: boolean;
  section_ids?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AcademicStructureService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/academic`;

  // --- Grades ---
  getGrades(): Observable<IGrade[]> {
    return this.http.get<IGrade[]>(`${this.API_URL}/grades`);
  }

  createGrade(name: string): Observable<any> {
    return this.http.post(`${this.API_URL}/grades`, { name });
  }

  updateGrade(id: string, payload: { name?: string; sort_order?: number; is_active?: boolean }): Observable<any> {
    return this.http.put(`${this.API_URL}/grades/${id}`, payload);
  }

  deleteGrade(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/grades/${id}`);
  }

  // --- Sections ---
  getSections(): Observable<ISection[]> {
    return this.http.get<ISection[]>(`${this.API_URL}/sections`);
  }

  createSection(payload: { name: string; grade_id: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/sections`, payload);
  }

  updateSection(id: string, payload: { name?: string; sort_order?: number; is_active?: boolean }): Observable<any> {
    return this.http.put(`${this.API_URL}/sections/${id}`, payload);
  }

  deleteSection(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/sections/${id}`);
  }

  // --- Subjects ---
  getSubjects(grade_id?: string): Observable<ISubject[]> {
    const url = grade_id ? `${this.API_URL}/subjects?grade_id=${grade_id}` : `${this.API_URL}/subjects`;
    return this.http.get<ISubject[]>(url);
  }

  createSubject(payload: { name: string; grade_id: string; section_id?: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/subjects`, payload);
  }

  updateSubject(id: string, payload: { name?: string; sort_order?: number; is_active?: boolean }): Observable<any> {
    return this.http.put(`${this.API_URL}/subjects/${id}`, payload);
  }

  deleteSubject(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/subjects/${id}`);
  }

  unlinkSubjectFromSection(subjectId: string, sectionId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/subjects/${subjectId}/section/${sectionId}`);
  }

  // --- Generic ---
  reorderItems(model: 'grades' | 'sections' | 'subjects', items: { id: string; sort_order: number }[]): Observable<any> {
    return this.http.put(`${this.API_URL}/reorder/${model}`, { items });
  }

  bulkSetup(payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/bulk-setup`, payload);
  }
}
