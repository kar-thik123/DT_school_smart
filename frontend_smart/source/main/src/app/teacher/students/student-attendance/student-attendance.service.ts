import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface AttendancePhase {
  id: string;
  phase_name: string;
  start_period: number;
  end_period: number;
  display_order: number;
}

export interface StudentAttendanceRecord {
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface MarkAttendancePayload {
  grade_id: string;
  section_id?: string;
  phase_id: string;
  attendance_date: string;
  records: StudentAttendanceRecord[];
}

@Injectable({
  providedIn: 'root',
})
export class StudentAttendanceService {
  private httpClient = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/attendance`;

  getPhases(): Observable<AttendancePhase[]> {
    return this.httpClient.get<AttendancePhase[]>(`${this.apiUrl}/phases`);
  }

  getMyAssignments(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${environment.apiUrl}/teacher-assignments/me`);
  }

  getDailyAttendance(gradeId: string, phaseId: string, date: string, sectionId?: string): Observable<any[]> {
    let url = `${this.apiUrl}/daily?grade_id=${gradeId}&phase_id=${phaseId}&date=${date}`;
    if (sectionId) {
      url += `&section_id=${sectionId}`;
    }
    return this.httpClient.get<any[]>(url);
  }

  getRangeAttendance(gradeId: string, startDate: string, endDate: string, sectionId?: string): Observable<any[]> {
    let url = `${this.apiUrl}/range?grade_id=${gradeId}&start_date=${startDate}&end_date=${endDate}`;
    if (sectionId) {
      url += `&section_id=${sectionId}`;
    }
    return this.httpClient.get<any[]>(url);
  }

  markAttendance(payload: MarkAttendancePayload): Observable<any> {
    return this.httpClient.post<any>(`${this.apiUrl}/mark`, payload);
  }

  getSummary(gradeId: string, sectionId?: string): Observable<any[]> {
    let url = `${this.apiUrl}/summary?grade_id=${gradeId}`;
    if (sectionId) {
      url += `&section_id=${sectionId}`;
    }
    return this.httpClient.get<any[]>(url);
  }
}
