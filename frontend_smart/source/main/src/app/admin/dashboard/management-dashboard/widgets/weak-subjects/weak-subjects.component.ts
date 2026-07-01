import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { ManagementDashboardService, WeakSubject } from '../../management-dashboard.service';
import { AcademicContextService } from '@core/service/academic-context.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-management-weak-subjects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DashboardWidgetWrapperComponent
  ],
  templateUrl: './weak-subjects.component.html'
})
export class WeakSubjectsComponent implements OnInit, OnDestroy {
  private dashboardService = inject(ManagementDashboardService);
  private academicContextService = inject(AcademicContextService);
  private sub: Subscription = new Subscription();

  widgetState: WidgetState = 'loading';
  weakSubjects: WeakSubject[] = [];

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
    this.dashboardService.getWeakSubjects().subscribe({
      next: (data) => {
        this.weakSubjects = data;
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
