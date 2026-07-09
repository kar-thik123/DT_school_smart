import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentDashboardService } from '../../dashboard.service';
import { TeacherAssignment } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, WidgetSkeletonComponent],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  teachers: TeacherAssignment[] = [];

  constructor(private dashboardService: StudentDashboardService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.state = 'loading';
    this.dashboardService.getTeachers().subscribe({
      next: (data) => {
        this.teachers = data;
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }
}
