import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentDashboardService } from '../../dashboard.service';
import { StudentDashboardContextService } from '../../student-dashboard-context.service';
import { TimelineActivity, StudentKPIs, StudentSkill } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, WidgetSkeletonComponent],
  templateUrl: './recent-activity.component.html',
  styleUrls: ['./recent-activity.component.scss']
})
export class RecentActivityComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  activities: TimelineActivity[] = [];
  groupedActivities: any[] = [];
  kpis: StudentKPIs | null = null;
  skills: StudentSkill[] = [];
  showAllActivities = false;

  constructor(
    private dashboardService: StudentDashboardService,
    private contextService: StudentDashboardContextService
  ) {}

  ngOnInit() {
    this.contextService.overview$.subscribe(overview => {
      this.loadData(overview.academic_year_id!);
    });
  }

  loadData(academicYearId: string) {
    this.state = 'loading';
    forkJoin({
      activities: this.dashboardService.getActivities().pipe(catchError(() => of([]))),
      kpis: this.dashboardService.getKPIs().pipe(catchError(() => of(null))),
      skills: this.dashboardService.getSkills(academicYearId).pipe(catchError(() => of([])))
    }).subscribe({
      next: (data: any) => {
        this.activities = data.activities;
        this.kpis = data.kpis;
        this.skills = data.skills;
        this.groupTimelineActivities();
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  toggleActivities() {
    this.showAllActivities = !this.showAllActivities;
  }

  private getRelativeTime(dateString: string): string {
    if (!dateString) return 'Recently';
    const actDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - actDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return actDate.toLocaleDateString();
  }

  private groupTimelineActivities() {
    this.groupedActivities = [];
    if (!this.activities || this.activities.length === 0) return;

    let practiceCount = 0;
    let completionCount = 0;
    let latestPracticeDate = '';
    let latestCompletionDate = '';

    this.activities.forEach(act => {
      if (act.type === 'practice') {
        practiceCount++;
        if (!latestPracticeDate || new Date(act.date) > new Date(latestPracticeDate)) latestPracticeDate = act.date as string;
      }
      if (act.type === 'completion') {
        completionCount++;
        if (!latestCompletionDate || new Date(act.date) > new Date(latestCompletionDate)) latestCompletionDate = act.date as string;
      }
    });

    if (completionCount > 0) {
      this.groupedActivities.push({
        icon: 'fas fa-book',
        bg: 'bg-light-primary text-primary',
        title: `Completed ${completionCount} Topics`,
        time: this.getRelativeTime(latestCompletionDate)
      });
    }

    if (practiceCount > 0) {
      this.groupedActivities.push({
        icon: 'fas fa-pen',
        bg: 'bg-light-success text-success',
        title: `Finished ${practiceCount} Practice Quizzes`,
        time: this.getRelativeTime(latestPracticeDate)
      });
    }

    if ((this.kpis?.readyForExam || 0) >= 80) {
       this.groupedActivities.push({
        icon: 'fas fa-bullseye',
        bg: 'bg-light-danger text-danger',
        title: `Reached 80% Readiness!`,
        time: this.getRelativeTime(latestPracticeDate || latestCompletionDate)
      });
    }

    const recentSkill = this.skills.find(s => s.status === 'approved');
    if (recentSkill) {
      this.groupedActivities.push({
        icon: 'fas fa-star',
        bg: 'bg-light-warning text-warning',
        title: `Verified ${recentSkill.skill_name} Skill`,
        time: this.getRelativeTime(new Date().toISOString())
      });
    }
  }
}
