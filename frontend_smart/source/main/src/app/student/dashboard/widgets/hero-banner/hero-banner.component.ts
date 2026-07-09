import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentDashboardService } from '../../dashboard.service';
import { StudentDashboardContextService } from '../../student-dashboard-context.service';
import { StudentOverview, StudentKPIs, SubjectPerformance, TimelineActivity } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, WidgetSkeletonComponent],
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss']
})
export class HeroBannerComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  overview: StudentOverview | null = null;
  kpis: StudentKPIs | null = null;
  heroState: any = null;

  constructor(
    private dashboardService: StudentDashboardService,
    private contextService: StudentDashboardContextService,
    private router: Router
  ) {}

  ngOnInit() {
    this.contextService.overview$.subscribe(overview => {
      this.overview = overview;
      this.loadData();
    });
  }

  loadData() {
    this.state = 'loading';
    forkJoin({
      kpis: this.dashboardService.getKPIs().pipe(catchError(() => of(null))),
      subjects: this.dashboardService.getSubjectPerformance().pipe(catchError(() => of([]))),
      activities: this.dashboardService.getActivities().pipe(catchError(() => of([])))
    }).subscribe({
      next: (data: any) => {
        this.kpis = data.kpis;
        this.computeHeroState(data.subjects || [], data.activities || []);
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  private computeHeroState(subjects: SubjectPerformance[], activities: TimelineActivity[]) {
    if (subjects.length > 0) {
      const activeSubject = subjects.sort((a, b) => a.readiness - b.readiness)[0];
      
      let currentTopic = 'Introduction Module';
      const lastCompletion = activities.find(a => a.type === 'completion');
      if (lastCompletion && lastCompletion.description) {
        currentTopic = lastCompletion.description.replace('Completed Topic: ', '');
      } else {
        const lastPractice = activities.find(a => a.type === 'practice');
        if (lastPractice && lastPractice.description) {
          currentTopic = lastPractice.description;
        }
      }

      this.heroState = {
        subjectId: activeSubject.subjectId,
        nextNode: activeSubject.nextNode,
        subject: activeSubject.subjectName,
        topic: currentTopic,
        progress: `${activeSubject.topicCompleted} of ${activeSubject.topicTotal} Topics Completed`,
        percentage: activeSubject.topicTotal > 0 ? ((activeSubject.topicCompleted / activeSubject.topicTotal) * 100).toFixed(0) : 0
      };
    } else {
      this.heroState = { subject: 'Introduction', topic: 'Getting Started', progress: '0 of 1 Topics Completed', percentage: 0 };
    }
  }

  navigateToPractice(subjectId?: string, subjectName?: string, nextNode?: any) {
    if (subjectId) {
      const queryParams: any = { subject_id: subjectId, subject_name: subjectName };
      this.router.navigate(['/student/academics/mcq'], { queryParams });
    } else {
      this.router.navigate(['/student/academics/mcq']);
    }
  }
}
