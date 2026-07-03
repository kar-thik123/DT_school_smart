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

export interface StaffAttendanceRecord {
  staff_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface MarkAttendancePayload {
  phase_id: string;
  attendance_date: string;
  records: StaffAttendanceRecord[];
}

@Injectable({
  providedIn: 'root',
})
export class StaffAttendanceService {
  private httpClient = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/staff-attendance`;

  getPhases(): Observable<AttendancePhase[]> {
    return this.httpClient.get<AttendancePhase[]>(`${environment.apiUrl}/attendance/phases`);
  }

  getDailyAttendance(phaseId: string, date: string): Observable<any[]> {
    let url = `${this.apiUrl}/daily?phase_id=${phaseId}&date=${date}`;
    return this.httpClient.get<any[]>(url);
  }

  getRangeAttendance(startDate: string, endDate: string): Observable<any[]> {
    let url = `${this.apiUrl}/range?start_date=${startDate}&end_date=${endDate}`;
    return this.httpClient.get<any[]>(url);
  }

  markAttendance(payload: MarkAttendancePayload): Observable<any> {
    return this.httpClient.post<any>(`${this.apiUrl}/mark`, payload);
  }

  getSummary(): Observable<any[]> {
    let url = `${this.apiUrl}/summary`;
    return this.httpClient.get<any[]>(url);
  }
}
