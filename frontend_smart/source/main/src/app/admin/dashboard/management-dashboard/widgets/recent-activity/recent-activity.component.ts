import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { ManagementDashboardService, RecentActivity } from '../../management-dashboard.service';
import { AcademicContextService } from '@core/service/academic-context.service';

@Component({
  selector: 'app-management-recent-activity',
  standalone: true,
  imports: [
    CommonModule,
    DashboardWidgetWrapperComponent
  ],
  templateUrl: './recent-activity.component.html'
})
export class RecentActivityComponent implements OnInit, OnDestroy {
  private dashboardService = inject(ManagementDashboardService);
  private academicContextService = inject(AcademicContextService);
  private sub: Subscription = new Subscription();

  widgetState: WidgetState = 'loading';
  activities: RecentActivity[] = [];

  ngOnInit(): void {
    // Note: Recent activity is org-wide, but we can refresh on year change anyway
    this.sub.add(
      this.academicContextService.historicalYear$.subscribe(() => {
        this.loadData();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadData(): void {
    this.widgetState = 'loading';
    this.dashboardService.getRecentActivity().subscribe({
      next: (data) => {
        this.activities = data;
        if (!data || data.length === 0) {
          this.widgetState = 'empty';
        } else {
          this.widgetState = 'success';
        }
      },
      error: () => {
        this.widgetState = 'error';
      }
    });
  }
}
