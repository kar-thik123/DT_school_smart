import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ExamScheduleService } from './exam-schedule.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ExamSchedule } from './exam-schedule.model';
import { Subject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-exam-schedule',
  templateUrl: './exam-schedule.component.html',
  styleUrls: ['./exam-schedule.component.scss'],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class ExamScheduleComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  examScheduleService = inject(ExamScheduleService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'class', label: 'Class', type: 'text', visible: true },
    { def: 'date', label: 'Date', type: 'text', visible: true },
    { def: 'time', label: 'Time', type: 'text', visible: true },
    { def: 'duration', label: 'Duration', type: 'text', visible: true },
    { def: 'roomNo', label: 'Room No', type: 'text', visible: true },
    { def: 'totalMarks', label: 'Total Marks', type: 'text', visible: true },
    { def: 'reqMarks', label: 'Required Marks', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<ExamSchedule>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Schedule',
      items: ['Teacher'],
      active: 'Exam Schedule',
    },
  ];

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.isLoading = true;
    this.examScheduleService.getAllExamSchedules().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (
          data: ExamSchedule,
          filter: string
        ) =>
          Object.values(data).some((value) =>
            value.toString().toLowerCase().includes(filter)
          );
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }
}
