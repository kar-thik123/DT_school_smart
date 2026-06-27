import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface OverviewMetrics {
  totalStudents: number;
  boysCount: number;
  girlsCount: number;
  avgScore: number;
  scoreTrend: number;
  above80: number;
  above80Percentage: number;
  below50: number;
  below50Percentage: number;
  assessmentsCount: number;
  pendingEvaluations: number;
}

export interface PerformanceTrend {
  examName: string;
  avgScore: number;
}

export interface TopicMastery {
  topicName: string;
  completed: boolean;
  avgScore: number;
  masteryLevel: string;
}

export interface WeakStudent {
  name: string;
  avgScore: number;
  weakTopics: string[];
}

export interface LessonPlanProgress {
  completed: number;
  inProgress: number;
  pending: number;
  nextTopic: string;
  plannedDate: string;
}

export interface RecentAssessment {
  examName: string;
  date: string;
  classAvg: number;
  highest: number;
  lowest: number;
  pendingEval: number;
}

export interface SummaryStats {
  attendancePercentage: number;
  practiceQuestionsAttempted: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherDashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMyAssignments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/teacher-assignments/me`);
  }

  getOverview(sectionId: string, subjectId?: string): Observable<OverviewMetrics> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<OverviewMetrics>(`${this.apiUrl}/teacher-dashboard/overview`, { params });
  }

  getPerformanceTrend(sectionId: string, subjectId?: string): Observable<{trend: PerformanceTrend[]}> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<{trend: PerformanceTrend[]}>(`${this.apiUrl}/teacher-dashboard/performance-trend`, { params });
  }

  getTopicMastery(sectionId: string, subjectId?: string): Observable<TopicMastery[]> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<TopicMastery[]>(`${this.apiUrl}/teacher-dashboard/topic-mastery`, { params });
  }

  getWeakStudents(sectionId: string, subjectId?: string): Observable<WeakStudent[]> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<WeakStudent[]>(`${this.apiUrl}/teacher-dashboard/weak-students`, { params });
  }

  getLessonPlanProgress(sectionId: string, subjectId?: string): Observable<LessonPlanProgress> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<LessonPlanProgress>(`${this.apiUrl}/teacher-dashboard/lesson-plan-progress`, { params });
  }

  getRecentAssessments(sectionId: string, subjectId?: string): Observable<RecentAssessment[]> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<RecentAssessment[]>(`${this.apiUrl}/teacher-dashboard/recent-assessments`, { params });
  }

  getSummaryStats(sectionId: string, subjectId?: string): Observable<SummaryStats> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<SummaryStats>(`${this.apiUrl}/teacher-dashboard/summary-stats`, { params });
  }
}
