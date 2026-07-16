import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardLayoutComponent } from '../../../shared/components/dashboard-layout/dashboard-layout.component';
import { DashboardSectionHeaderComponent } from '../../../shared/components/dashboard-widgets/dashboard-section-header/dashboard-section-header.component';
import { DashboardChartCardComponent } from '../../../shared/components/dashboard-widgets/dashboard-chart-card/dashboard-chart-card.component';
import { DashboardListCardComponent } from '../../../shared/components/dashboard-widgets/dashboard-list-card/dashboard-list-card.component';
import { DashboardWidgetWrapperComponent } from '../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { AcademicYear } from '../../../shared/components/academic-year-selector/academic-year-selector.component';
import { ManagementDashboardService } from './management-dashboard.service';
import { OverviewKpisComponent } from './widgets/overview-kpis/overview-kpis.component';
import { CurriculumCoverageComponent } from './widgets/curriculum-coverage/curriculum-coverage.component';
import { WeakSubjectsComponent } from './widgets/weak-subjects/weak-subjects.component';
import { TeacherLeaderboardComponent } from './widgets/teacher-leaderboard/teacher-leaderboard.component';
import { StudentRiskComponent } from './widgets/student-risk/student-risk.component';
import { RecentActivityComponent } from './widgets/recent-activity/recent-activity.component';
import { ExaminationSummaryComponent } from './widgets/examination-summary/examination-summary.component';
import { AcademicContextService } from '@core/service/academic-context.service';

@Component({
  selector: 'app-management-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardLayoutComponent,
    OverviewKpisComponent,
    CurriculumCoverageComponent,
    TeacherLeaderboardComponent,
    WeakSubjectsComponent,
    StudentRiskComponent,
    RecentActivityComponent,
    ExaminationSummaryComponent
  ],
  templateUrl: './management-dashboard.component.html',
  styleUrls: ['./management-dashboard.component.scss']
})
export class ManagementDashboardComponent implements OnInit {
  private dashboardService = inject(ManagementDashboardService);
  private academicContextService = inject(AcademicContextService);

  academicYears: AcademicYear[] = [];
  selectedYearId: string | null = null;
  academicYearName: string = '';

  ngOnInit(): void {
    const savedYear = this.academicContextService.currentHistoricalYear;
    if (savedYear) {
      this.academicYearName = savedYear.academic_year || savedYear.name;
      this.selectedYearId = savedYear.id;
    }

    this.academicContextService.activeYear$.subscribe((year: any) => {
      if (year && !this.selectedYearId) {
        this.academicYearName = year.academic_year || year.name;
        this.selectedYearId = year.id;
        this.onYearSelected(year);
      }
    });
    this.loadAcademicYears();
  }

  loadAcademicYears() {
    this.dashboardService.getAcademicYears().subscribe({
      next: (years) => {
        this.academicYears = years;
        // Auto-select active year or first available if not set
        if (!this.selectedYearId && years.length > 0) {
          const defaultYear = years.find(y => y.is_active) || years[0];
          if (defaultYear) {
            this.selectedYearId = defaultYear.id;
            this.academicYearName = defaultYear.name || (defaultYear as any).academic_year;
            this.onYearSelected(defaultYear);
          }
        }
      },
      error: () => console.error('Failed to load academic years')
    });
  }

  onYearSelected(year: any) {
    this.selectedYearId = year.id;
    // Context is updated centrally. Widgets listen to this.
    this.dashboardService.setDashboardAcademicYear(year);
  }
}
