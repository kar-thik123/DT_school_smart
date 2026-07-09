import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { StudentDashboardService } from './dashboard.service';
import { StudentDashboardContextService } from './student-dashboard-context.service';
import { StudentOverview } from './dashboard.model';

import { HeroBannerComponent } from './widgets/hero-banner/hero-banner.component';
import { KpisComponent } from './widgets/kpis/kpis.component';
import { ActionCenterComponent } from './widgets/action-center/action-center.component';
import { SubjectAnalyticsComponent } from './widgets/subject-analytics/subject-analytics.component';
import { WeeklyTrendComponent } from './widgets/weekly-trend/weekly-trend.component';
import { AttendanceComponent } from './widgets/attendance/attendance.component';
import { ExaminationAnalyticsComponent } from './widgets/examination-analytics/examination-analytics.component';
import { RecentActivityComponent } from './widgets/recent-activity/recent-activity.component';
import { AchievementsComponent } from './widgets/achievements/achievements.component';
import { SupportComponent } from './widgets/support/support.component';
import { SkillsOverviewComponent } from './widgets/skills-overview/skills-overview.component';
import { MyFavoritesComponent } from './widgets/my-favorites/my-favorites.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    BreadcrumbComponent,
    HeroBannerComponent,
    KpisComponent,
    ActionCenterComponent,
    SubjectAnalyticsComponent,
    WeeklyTrendComponent,
    AttendanceComponent,
    ExaminationAnalyticsComponent,
    RecentActivityComponent,
    AchievementsComponent,
    SupportComponent,
    SkillsOverviewComponent,
    MyFavoritesComponent
  ]
})
export class DashboardComponent implements OnInit {
  breadscrums = [
    {
      title: 'Home',
      items: ['Student'],
      active: 'Learner Home',
    },
  ];

  loading: boolean = true;
  error: string | null = null;
  notEnrolledInActiveYear: boolean = false;
  overview: StudentOverview | null = null;

  constructor(
    private dashboardService: StudentDashboardService,
    private contextService: StudentDashboardContextService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.dashboardService.getOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.notEnrolledInActiveYear = !!(overview && !overview.grade);
        if (overview) {
          this.contextService.setOverview(overview);
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load dashboard data.';
        this.loading = false;
      }
    });
  }
}
