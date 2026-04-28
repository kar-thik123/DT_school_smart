import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { ITeacherAssignment, ITeacherAssignmentPayload, IBatchTeacherAssignmentPayload } from '../models/teacher-assignment.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherAssignmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teacher-assignments`;

  getAllAssignments(): Observable<ITeacherAssignment[]> {
    return this.http.get<ITeacherAssignment[]>(this.apiUrl);
  }

  getGroupedAssignments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?grouped=true`);
  }

  getInstructionalStaff(): Observable<{id: string, name: string, email: string}[]> {
    return this.http.get<{id: string, name: string, email: string}[]>(`${environment.apiUrl}/users/teachers`);
  }

  createAssignment(payload: ITeacherAssignmentPayload): Observable<{ message: string, assignment: ITeacherAssignment }> {
    return this.http.post<{ message: string, assignment: ITeacherAssignment }>(this.apiUrl, payload);
  }

  createBatchAssignments(payload: IBatchTeacherAssignmentPayload): Observable<{ message: string, count: number }> {
    return this.http.post<{ message: string, count: number }>(this.apiUrl, payload);
  }

  updateAssignment(id: string, payload: ITeacherAssignmentPayload): Observable<{ message: string, assignment: ITeacherAssignment }> {
    return this.http.put<{ message: string, assignment: ITeacherAssignment }>(`${this.apiUrl}/${id}`, payload);
  }

  deleteAssignment(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
