import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StudentDashboardService } from '../../dashboard.service';
import { SubjectPerformance } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-subject-analytics',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressBarModule, WidgetSkeletonComponent],
  templateUrl: './subject-analytics.component.html',
  styleUrls: ['./subject-analytics.component.scss']
})
export class SubjectAnalyticsComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  subjects: SubjectPerformance[] = [];

  constructor(private dashboardService: StudentDashboardService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.state = 'loading';
    this.dashboardService.getSubjectPerformance().subscribe({
      next: (data) => {
        this.subjects = (data || []).sort((a: SubjectPerformance, b: SubjectPerformance) => a.readiness - b.readiness);
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }
}
