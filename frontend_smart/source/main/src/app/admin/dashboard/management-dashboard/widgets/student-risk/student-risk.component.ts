import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { ManagementDashboardService, StudentRisk } from '../../management-dashboard.service';
import { AcademicContextService } from '@core/service/academic-context.service';

@Component({
  selector: 'app-management-student-risk',
  standalone: true,
  imports: [
    CommonModule,
    DashboardWidgetWrapperComponent
  ],
  templateUrl: './student-risk.component.html'
})
export class StudentRiskComponent implements OnInit, OnDestroy {
  private dashboardService = inject(ManagementDashboardService);
  private academicContextService = inject(AcademicContextService);
  private sub: Subscription = new Subscription();

  widgetState: WidgetState = 'loading';
  students: StudentRisk[] = [];

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
    this.dashboardService.getStudentRisk().subscribe({
      next: (data) => {
        this.students = data;
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

  getRiskCount(factor: string): number {
    return this.students.filter(s => s.risk_factor === factor).length;
  }
}
