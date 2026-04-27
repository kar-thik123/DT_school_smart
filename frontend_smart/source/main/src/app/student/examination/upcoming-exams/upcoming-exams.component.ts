import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  ColumnDefinition,
  MasterTableComponent,
} from '@shared/components/master-table/master-table.component';
import { UpcomingExam } from './upcoming-exams.model';
import { UpcomingExamsService } from './upcoming-exams.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-upcoming-exams',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    BreadcrumbComponent,
    MasterTableComponent,
  ],
  templateUrl: './upcoming-exams.component.html',
  styleUrls: ['./upcoming-exams.component.scss'],
})
export class UpcomingExamsComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'examName', label: 'Exam Name', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'examDate', label: 'Date', type: 'date', visible: true },
    { def: 'startTime', label: 'Start Time', type: 'text', visible: true },
    { def: 'endTime', label: 'End Time', type: 'text', visible: true },
    { def: 'roomNo', label: 'Room No', type: 'text', visible: true },
    { def: 'totalMarks', label: 'Total Marks', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<UpcomingExam>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public upcomingExamsService: UpcomingExamsService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.upcomingExamsService.getAllUpcomingExams().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      },
    });
  }

  refresh() {
    this.loadData();
  }

  detailsCall(row: UpcomingExam) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Upcoming Exam',
        type: 'Exam',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
