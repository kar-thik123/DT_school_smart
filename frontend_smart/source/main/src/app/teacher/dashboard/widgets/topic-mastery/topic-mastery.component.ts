import { Component, OnInit, OnDestroy, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { TeacherDashboardService, TopicMastery } from '../../teacher-dashboard.service';
import { TeacherDashboardContextService } from '../../teacher-dashboard-context.service';

@Component({
  selector: 'app-teacher-topic-mastery',
  standalone: true,
  imports: [CommonModule, DashboardWidgetWrapperComponent],
  templateUrl: './topic-mastery.component.html'
})
export class TopicMasteryComponent implements OnInit, OnDestroy {
  private dashboardService = inject(TeacherDashboardService);
  public contextService = inject(TeacherDashboardContextService);
  private sub = new Subscription();

  @Input() selectedSubjectId: string = '';

  state: WidgetState = 'loading';
  topicMastery: TopicMastery[] = [];
  showAllMasterySubjects: boolean = false;

  toggleMasterySubjects() {
    this.showAllMasterySubjects = !this.showAllMasterySubjects;
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
    this.dashboardService.getTopicMastery(sectionId, subjectId).subscribe({
      next: (data) => {
        this.topicMastery = data || [];
        this.state = this.topicMastery.length === 0 ? 'empty' : 'success';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }
}
