import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import {
  StudentOverview,
  StudentKPIs,
  SubjectPerformance,
  WeeklyTrend,
  CurriculumProgress,
  TeacherAssignment,
  TimelineActivity,
  StudentSkill,
  AttendanceSummary,
  ContinueLearning
} from './dashboard.model';
import { AuthService } from '@core/service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class StudentDashboardService {
  private readonly apiUrl = `${environment.apiUrl}/student-dashboard`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getOverview(): Observable<StudentOverview> {
    return this.http.get<StudentOverview>(`${this.apiUrl}/overview`);
  }

  getKPIs(): Observable<StudentKPIs> {
    return this.http.get<StudentKPIs>(`${this.apiUrl}/kpis`);
  }

  getSubjectPerformance(): Observable<SubjectPerformance[]> {
    return this.http.get<SubjectPerformance[]>(`${this.apiUrl}/subjects`);
  }

  getWeeklyTrend(): Observable<WeeklyTrend[]> {
    return this.http.get<WeeklyTrend[]>(`${this.apiUrl}/weekly-trend`);
  }

  getAttendance(): Observable<AttendanceSummary> {
    return this.http.get<AttendanceSummary>(`${this.apiUrl}/attendance`);
  }

  getContinueLearning(): Observable<ContinueLearning> {
    return this.http.get<ContinueLearning>(`${this.apiUrl}/continue-learning`);
  }

  getCurriculumProgress(): Observable<CurriculumProgress[]> {
    return this.http.get<CurriculumProgress[]>(`${this.apiUrl}/curriculum-progress`);
  }

  getTeachers(): Observable<TeacherAssignment[]> {
    return this.http.get<TeacherAssignment[]>(`${this.apiUrl}/teachers`);
  }

  getActivities(): Observable<TimelineActivity[]> {
    return this.http.get<TimelineActivity[]>(`${this.apiUrl}/activities`);
  }

  getSkills(academicYearId: string): Observable<StudentSkill[]> {
    const userId = this.authService.currentUserValue?.id || this.authService.currentUserValue?.user_id;
    return this.http.get<StudentSkill[]>(`${environment.apiUrl}/skills/user/${userId}?academic_year_id=${academicYearId}`);
  }
}
