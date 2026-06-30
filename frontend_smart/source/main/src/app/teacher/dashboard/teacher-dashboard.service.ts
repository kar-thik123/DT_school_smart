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
  subjectId?: string;
  topicName: string;
  completed: number;
  avgScore: number;
  masteryLevel: string;
}

export interface WeakStudent {
  name: string;
  rollNumber?: string;
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
  present?: number;
  late?: number;
  absent?: number;
  practiceQuestionsAttempted: number;
}

export interface TopPerformer {
  name: string;
  rollNumber?: string;
  score: number;
  examName: string;
}

export interface SyllabusCoverage {
  total: number;
  completed: number;
  percentage: number;
}

export interface UnreadMessages {
  unreadMail: number;
  unreadNotifications: number;
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

  getPendingSkills(sectionId: string): Observable<{count: number}> {
    let params = new HttpParams().set('section_id', sectionId);
    return this.http.get<{count: number}>(`${this.apiUrl}/teacher-dashboard/pending-skills`, { params });
  }

  getSyllabusCoverage(sectionId: string, subjectId?: string): Observable<SyllabusCoverage> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<SyllabusCoverage>(`${this.apiUrl}/teacher-dashboard/syllabus-coverage`, { params });
  }

  getTopPerformers(sectionId: string, subjectId?: string): Observable<TopPerformer[]> {
    let params = new HttpParams().set('section_id', sectionId);
    if (subjectId) params = params.set('subject_id', subjectId);
    return this.http.get<TopPerformer[]>(`${this.apiUrl}/teacher-dashboard/top-performers`, { params });
  }

  getUnreadMessages(): Observable<UnreadMessages> {
    return this.http.get<UnreadMessages>(`${this.apiUrl}/teacher-dashboard/unread-messages`);
  }

  getHomeworkCompliance(sectionId: string): Observable<{rate: number}> {
    let params = new HttpParams().set('section_id', sectionId);
    return this.http.get<{rate: number}>(`${this.apiUrl}/teacher-dashboard/homework-compliance`, { params });
  }
}
