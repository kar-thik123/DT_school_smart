import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { CommonModule } from '@angular/common';
import { ManagementDashboardService, WeakSubject } from '../../dashboard/management-dashboard/management-dashboard.service';
import { AcademicContextService } from '@core';

@Component({
  selector: 'app-weak-subjects-report',
  templateUrl: './weak-subjects.component.html',
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent, CommonModule],
})
export class WeakSubjectsReportComponent implements OnInit, OnDestroy {
  dashboardService = inject(ManagementDashboardService);
  academicContextService = inject(AcademicContextService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'average_score', label: 'Average Score (%)', type: 'text', visible: true },
    { def: 'students_evaluated', label: 'Students Evaluated', type: 'text', visible: true },
    { def: 'latest_exam', label: 'Latest Exam', type: 'text', visible: true }
  ];

  dataSource = new MatTableDataSource<WeakSubject>([]);
  isLoading = true;
  private sub: Subscription = new Subscription();

  breadscrums = [{ title: 'Weak Subjects', items: ['Reports'], active: 'Weak Subjects' }];

  ngOnInit() {
    this.sub.add(
      this.academicContextService.historicalYear$.subscribe(() => {
        this.loadData();
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  handleRefresh() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.dashboardService.getWeakSubjects('all').subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: WeakSubject, filter: string) =>
          Object.values(data).some((value) => value !== null && value !== undefined && value.toString().toLowerCase().includes(filter));
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }
}
