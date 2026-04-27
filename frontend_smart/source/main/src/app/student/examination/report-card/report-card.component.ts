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
import { ReportCard } from './report-card.model';
import { ReportCardService } from './report-card.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-report-card',
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
  templateUrl: './report-card.component.html',
  styleUrls: ['./report-card.component.scss'],
})
export class ReportCardComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    {
      def: 'academicYear',
      label: 'Academic Year',
      type: 'text',
      visible: true,
    },
    { def: 'className', label: 'Class', type: 'text', visible: true },
    { def: 'examName', label: 'Exam', type: 'text', visible: true },
    { def: 'totalMarks', label: 'Total Marks', type: 'text', visible: true },
    {
      def: 'obtainedMarks',
      label: 'Obtained Marks',
      type: 'text',
      visible: true,
    },
    { def: 'percentage', label: 'Percentage (%)', type: 'text', visible: true },
    {
      def: 'grade',
      label: 'Grade',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        'A+': 'badge-success',
        A: 'badge-primary',
        'B+': 'badge-warning',
        Pass: 'badge-success',
      },
    },
    {
      def: 'result',
      label: 'Result',
      type: 'status',
      visible: true,
      statusBadgeMap: { Pass: 'badge-success', Fail: 'badge-danger' },
    },
  ];

  dataSource = new MatTableDataSource<ReportCard>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public reportCardService: ReportCardService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.reportCardService.getAllReportCards().subscribe({
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

  detailsCall(row: ReportCard) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Report Card',
        type: 'Report Card',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
