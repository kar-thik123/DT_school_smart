import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { TeacherDashboardService, WeakStudent } from '../../teacher-dashboard.service';
import { TeacherDashboardContextService } from '../../teacher-dashboard-context.service';

@Component({
  selector: 'app-teacher-weak-students',
  standalone: true,
  imports: [CommonModule, DashboardWidgetWrapperComponent],
  templateUrl: './weak-students.component.html'
})
export class WeakStudentsComponent implements OnInit, OnDestroy {
  private dashboardService = inject(TeacherDashboardService);
  public contextService = inject(TeacherDashboardContextService);
  private sub = new Subscription();

  state: WidgetState = 'loading';
  weakStudents: WeakStudent[] = [];
  showAllRiskStudents: boolean = false;

  toggleRiskStudents() {
    this.showAllRiskStudents = !this.showAllRiskStudents;
  }

  ngOnInit(): void {
    this.sub.add(
      this.contextService.context$.subscribe(ctx => {
        this.loadData(ctx.sectionId, ctx.subjectId);
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadData(sectionId: string, subjectId?: string): void {
    this.state = 'loading';
    this.dashboardService.getWeakStudents(sectionId, subjectId).subscribe({
      next: (data) => {
        this.weakStudents = data || [];
        this.state = this.weakStudents.length === 0 ? 'empty' : 'success';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }
}
