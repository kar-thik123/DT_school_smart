import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { ManagementDashboardService, TeacherPerformance } from '../../management-dashboard.service';
import { AcademicContextService } from '@core/service/academic-context.service';

@Component({
  selector: 'app-management-teacher-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardWidgetWrapperComponent
  ],
  templateUrl: './teacher-leaderboard.component.html'
})
export class TeacherLeaderboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(ManagementDashboardService);
  private academicContextService = inject(AcademicContextService);
  private sub: Subscription = new Subscription();

  widgetState: WidgetState = 'loading';
  teachers: TeacherPerformance[] = [];

  ngOnInit(): void {
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
    this.dashboardService.getTeacherPerformance().subscribe({
      next: (data) => {
        this.teachers = data;
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
