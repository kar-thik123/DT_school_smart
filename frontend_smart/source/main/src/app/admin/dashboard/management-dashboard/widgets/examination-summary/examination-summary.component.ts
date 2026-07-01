import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { ManagementDashboardService } from '../../management-dashboard.service';
import { AcademicContextService } from '@core/service/academic-context.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-management-examination-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DashboardWidgetWrapperComponent
  ],
  templateUrl: './examination-summary.component.html'
})
export class ExaminationSummaryComponent implements OnInit, OnDestroy {
  private dashboardService = inject(ManagementDashboardService);
  private academicContextService = inject(AcademicContextService);
  private sub: Subscription = new Subscription();

  widgetState: WidgetState = 'loading';
  summary: any = null;

  ngOnInit() {
    this.sub.add(
      this.academicContextService.historicalYear$.subscribe(() => {
        this.loadData();
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  loadData() {
    this.widgetState = 'loading';
    this.dashboardService.getExaminationSummary().subscribe({
      next: (data) => {
        this.summary = data;
        if (!data) {
          this.widgetState = 'empty';
        } else {
          this.widgetState = 'success';
        }
      },
      error: (err) => {
        this.widgetState = err.status === 404 ? 'empty' : 'error';
      }
    });
  }
}
