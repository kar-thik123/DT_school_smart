import { Component, OnInit, OnDestroy, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { TeacherDashboardService, UnreadMessages, SyllabusCoverage } from '../../teacher-dashboard.service';
import { TeacherDashboardContextService } from '../../teacher-dashboard-context.service';

@Component({
  selector: 'app-teacher-admin-kpis',
  standalone: true,
  imports: [CommonModule, DashboardWidgetWrapperComponent],
  templateUrl: './admin-kpis.component.html'
})
export class AdminKpisComponent implements OnInit, OnDestroy {
  private dashboardService = inject(TeacherDashboardService);
  public contextService = inject(TeacherDashboardContextService);
  private sub = new Subscription();

  @Input() selectedSubjectId: string = '';

  state: WidgetState = 'loading';
  unreadMessages: UnreadMessages | null = null;
  pendingSkillsCount: number = 0;
  homeworkComplianceRate: number = 0;
  syllabusCoverage: SyllabusCoverage | null = null;

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
    forkJoin({
      unreadMessages: this.dashboardService.getUnreadMessages().pipe(catchError(() => of(null))),
      pendingSkills: this.dashboardService.getPendingSkills(sectionId).pipe(catchError(() => of({ count: 0 }))),
      homeworkCompliance: this.dashboardService.getHomeworkCompliance(sectionId).pipe(catchError(() => of({ rate: 0 }))),
      syllabusCoverage: this.dashboardService.getSyllabusCoverage(sectionId, subjectId).pipe(catchError(() => of(null)))
    }).subscribe({
      next: (data: any) => {
        this.unreadMessages = data.unreadMessages;
        this.pendingSkillsCount = data.pendingSkills?.count || 0;
        this.homeworkComplianceRate = data.homeworkCompliance?.rate || 0;
        this.syllabusCoverage = data.syllabusCoverage;
        this.state = 'success';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }
}
