import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { ManagementDashboardService, CurriculumCoverage } from '../../management-dashboard.service';
import { AcademicContextService } from '@core/service/academic-context.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-management-curriculum-coverage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashboardWidgetWrapperComponent
  ],
  templateUrl: './curriculum-coverage.component.html'
})
export class CurriculumCoverageComponent implements OnInit, OnDestroy {
  private dashboardService = inject(ManagementDashboardService);
  private academicContextService = inject(AcademicContextService);
  private router = inject(Router);
  private sub: Subscription = new Subscription();

  widgetState: WidgetState = 'loading';
  coverage: CurriculumCoverage | null = null;
  grades: any[] = [];
  selectedGradeId: string | null = null;

  ngOnInit(): void {
    this.sub.add(
      this.academicContextService.historicalYear$.subscribe(() => {
        this.loadGrades();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadGrades(): void {
    this.widgetState = 'loading';
    this.dashboardService.getGrades().subscribe(grades => {
      this.grades = grades || [];
      if (this.grades.length > 0) {
        if (!this.selectedGradeId || !this.grades.find(g => g.id === this.selectedGradeId)) {
          this.selectedGradeId = this.grades[0].id;
        }
        this.loadData();
      } else {
        this.selectedGradeId = null;
        this.coverage = null;
        this.widgetState = 'empty';
      }
    });
  }

  onGradeChange(): void {
    if (this.selectedGradeId) {
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.selectedGradeId) return;
    this.widgetState = 'loading';
    this.dashboardService.getCurriculumCoverage(this.selectedGradeId).subscribe({
      next: (data) => {
        this.coverage = data;
        if (!data || data.subject_breakdown.length === 0) {
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

  get totalCompleted(): number {
    if (!this.coverage) return 0;
    return this.coverage.subject_breakdown.reduce((sum, sub) => sum + sub.completed_topics, 0);
  }

  get totalPlanned(): number {
    if (!this.coverage) return 0;
    return this.coverage.subject_breakdown.reduce((sum, sub) => sum + sub.planned_topics, 0);
  }

  getProgressColorClass(progress: number): string {
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-primary';
    if (progress >= 25) return 'bg-warning';
    return 'bg-danger';
  }

  navigateToCurriculum(event: Event): void {
    event.preventDefault();
    if (this.selectedGradeId) {
      this.router.navigate(['/admin/administration/completion-mgmt'], {
        queryParams: { grade_id: this.selectedGradeId }
      });
    } else {
      this.router.navigate(['/admin/administration/completion-mgmt']);
    }
  }
}
