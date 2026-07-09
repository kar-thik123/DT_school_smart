import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { TeacherDashboardService, OverviewMetrics } from '../../teacher-dashboard.service';
import { TeacherDashboardContextService } from '../../teacher-dashboard-context.service';
import { AuthService } from '@core/service/auth.service';

@Component({
  selector: 'app-teacher-hero-banner',
  standalone: true,
  imports: [CommonModule, DashboardWidgetWrapperComponent],
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss']
})
export class HeroBannerComponent implements OnInit, OnDestroy {
  private dashboardService = inject(TeacherDashboardService);
  public contextService = inject(TeacherDashboardContextService);
  private authService = inject(AuthService);
  private sub = new Subscription();

  state: WidgetState = 'loading';
  teacherName: string = '';
  overview: OverviewMetrics | null = null;
  gradeName: string = '';
  sectionName: string = '';

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user && user.name) {
      this.teacherName = user.name;
    }

    this.sub.add(
      this.contextService.context$.subscribe(ctx => {
        this.loadData(ctx.sectionId, ctx.subjectId);
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  setClassInfo(gradeName: string, sectionName: string): void {
    this.gradeName = gradeName;
    this.sectionName = sectionName;
  }

  loadData(sectionId: string, subjectId?: string): void {
    this.state = 'loading';
    this.dashboardService.getOverview(sectionId, subjectId).subscribe({
      next: (data) => {
        this.overview = data;
        this.state = 'success';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }
}
