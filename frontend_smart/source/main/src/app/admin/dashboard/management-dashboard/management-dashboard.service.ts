import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { AcademicContextService } from '@core/service/academic-context.service';
import { AcademicYear } from '../../../shared/components/academic-year-selector/academic-year-selector.component';

export interface OverviewKpis {
  total_students: number;
  total_teachers: number;
  active_classes: number;
  overall_attendance_percent: number;
  overall_pass_rate: number;
}

export interface CurriculumCoverage {
  overall_progress: number;
  subject_breakdown: {
    subject: string;
    planned_topics: number;
    completed_topics: number;
    progress: number;
  }[];
}

export interface WeakSubject {
  subject: string;
  average_score: number;
  students_evaluated: number;
  latest_exam: string;
}

export interface TeacherPerformance {
  teacher_id: string;
  teacher_name: string;
  subject: string;
  average_score: number;
}

export interface StudentRisk {
  student_id: string;
  student_name: string;
  grade_section: string;
  average_score: number;
  risk_factor: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  actor_name: string;
  timestamp: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManagementDashboardService {
  private http = inject(HttpClient);
  private academicContextService = inject(AcademicContextService);
  private cache = new Map<string, any>();

  private getCacheKey(widgetName: string): string | null {
    const yearId = this.academicContextService.currentHistoricalYear?.id;
    if (!yearId) return null; // Fallback if no context is selected yet
    return `${widgetName}-${yearId}`;
  }

  private fetchWithCache<T>(widgetName: string, url: string): Observable<T> {
    const cacheKey = this.getCacheKey(widgetName);
    
    if (cacheKey && this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    return this.http.get<T>(url).pipe(
      tap(data => {
        if (cacheKey) {
          this.cache.set(cacheKey, data);
        }
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  getAcademicYears(): Observable<AcademicYear[]> {
    return this.http.get<AcademicYear[]>(`${environment.apiUrl}/academic/academic-years`);
  }
  
  getGrades(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/academic/grades`);
  }

  getOverviewKpis(): Observable<OverviewKpis> {
    return this.fetchWithCache<OverviewKpis>('overview', `${environment.apiUrl}/analytics/management/overview`);
  }

  getCurriculumCoverage(gradeId?: string): Observable<CurriculumCoverage> {
    const url = gradeId 
      ? `${environment.apiUrl}/analytics/management/curriculum-coverage?grade_id=${gradeId}`
      : `${environment.apiUrl}/analytics/management/curriculum-coverage`;
    
    // Explicitly manage cache key to include gradeId
    const baseCacheKey = this.getCacheKey('curriculum');
    const cacheKey = baseCacheKey ? (gradeId ? `${baseCacheKey}-${gradeId}` : baseCacheKey) : null;
    
    if (cacheKey && this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    return this.http.get<CurriculumCoverage>(url).pipe(
      tap(data => {
        if (cacheKey) {
          this.cache.set(cacheKey, data);
        }
      })
    );
  }

  getWeakSubjects(limit?: number | 'all'): Observable<WeakSubject[]> {
    const url = limit === 'all' 
      ? `${environment.apiUrl}/analytics/management/weak-subjects?limit=all`
      : `${environment.apiUrl}/analytics/management/weak-subjects`;
    
    const cacheKey = limit === 'all' ? 'weak-subjects-all' : 'weak-subjects';
    return this.fetchWithCache<WeakSubject[]>(cacheKey, url);
  }

  getExaminationSummary(): Observable<any> {
    return this.fetchWithCache<any>('examination-summary', `${environment.apiUrl}/analytics/management/examination-summary`);
  }

  getTeacherPerformance(): Observable<TeacherPerformance[]> {
    return this.fetchWithCache<TeacherPerformance[]>('teacher-performance', `${environment.apiUrl}/analytics/management/teacher-performance`);
  }

  getStudentRisk(): Observable<StudentRisk[]> {
    return this.fetchWithCache<StudentRisk[]>('student-risk', `${environment.apiUrl}/analytics/management/student-risk`);
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    return this.fetchWithCache<RecentActivity[]>('recent-activity', `${environment.apiUrl}/analytics/management/recent-activity`);
  }

  setDashboardAcademicYear(year: AcademicYear): void {
    this.academicContextService.setHistoricalYear(year);
  }
}
