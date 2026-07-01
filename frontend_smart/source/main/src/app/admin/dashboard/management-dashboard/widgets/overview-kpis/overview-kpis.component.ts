import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { ManagementDashboardService, OverviewKpis } from '../../management-dashboard.service';
import { AcademicContextService } from '@core/service/academic-context.service';

@Component({
  selector: 'app-management-overview-kpis',
  standalone: true,
  imports: [
    CommonModule,
    DashboardWidgetWrapperComponent
  ],
  templateUrl: './overview-kpis.component.html'
})
export class OverviewKpisComponent implements OnInit, OnDestroy {
  private dashboardService = inject(ManagementDashboardService);
  private academicContextService = inject(AcademicContextService);
  private sub: Subscription = new Subscription();
  
  kpiState: WidgetState = 'loading';
  overviewKpis: OverviewKpis | null = null;

  ngOnInit(): void {
    this.sub.add(
      this.academicContextService.historicalYear$.subscribe(() => {
        this.loadOverviewKpis();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadOverviewKpis(): void {
    this.kpiState = 'loading';
    this.dashboardService.getOverviewKpis().subscribe({
      next: (kpis) => {
        this.overviewKpis = kpis;
        if (kpis.total_students === 0 && kpis.total_teachers === 0) {
           this.kpiState = 'empty';
        } else {
           this.kpiState = 'success';
        }
      },
      error: () => {
        this.kpiState = 'error';
      }
    });
  }
}
