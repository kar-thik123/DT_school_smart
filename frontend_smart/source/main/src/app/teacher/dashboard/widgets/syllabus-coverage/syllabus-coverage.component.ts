import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { TeacherDashboardService, SyllabusCoverage } from '../../teacher-dashboard.service';
import { TeacherDashboardContextService } from '../../teacher-dashboard-context.service';

@Component({
  selector: 'app-teacher-syllabus-coverage',
  standalone: true,
  imports: [CommonModule, DashboardWidgetWrapperComponent],
  templateUrl: './syllabus-coverage.component.html'
})
export class SyllabusCoverageComponent implements OnInit, OnDestroy {
  private dashboardService = inject(TeacherDashboardService);
  public contextService = inject(TeacherDashboardContextService);
  private sub = new Subscription();

  state: WidgetState = 'loading';
  syllabusCoverage: SyllabusCoverage | null = null;
  hasSubjectSelected: boolean = false;

  ngOnInit(): void {
    this.sub.add(
      this.contextService.context$.subscribe(ctx => {
        this.hasSubjectSelected = !!ctx.subjectId;
        if (this.hasSubjectSelected) {
          this.loadData(ctx.sectionId, ctx.subjectId);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadData(sectionId: string, subjectId?: string): void {
    this.state = 'loading';
    this.dashboardService.getSyllabusCoverage(sectionId, subjectId).subscribe({
      next: (data) => {
        this.syllabusCoverage = data;
        this.state = 'success';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }
}
