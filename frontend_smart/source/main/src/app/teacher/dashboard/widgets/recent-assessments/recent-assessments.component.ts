import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { TeacherDashboardService, RecentAssessment } from '../../teacher-dashboard.service';
import { TeacherDashboardContextService } from '../../teacher-dashboard-context.service';

@Component({
  selector: 'app-teacher-recent-assessments',
  standalone: true,
  imports: [CommonModule, DashboardWidgetWrapperComponent],
  templateUrl: './recent-assessments.component.html'
})
export class RecentAssessmentsComponent implements OnInit, OnDestroy {
  private dashboardService = inject(TeacherDashboardService);
  public contextService = inject(TeacherDashboardContextService);
  private sub = new Subscription();

  state: WidgetState = 'loading';
  recentAssessments: RecentAssessment[] = [];

  ngOnInit(): void {
    this.sub.add(
      this.contextService.context$.subscribe(ctx => {
        this.loadData(ctx.sectionId, ctx.subjectId);
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadData(sectionId: string, subjectId?: string): void {
    this.state = 'loading';
    this.dashboardService.getRecentAssessments(sectionId, subjectId).subscribe({
      next: (data) => {
        this.recentAssessments = data || [];
        this.state = this.recentAssessments.length === 0 ? 'empty' : 'success';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }
}
