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
import { Results } from './results.model';
import { ResultsService } from './results.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-results',
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
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'examName', label: 'Exam Name', type: 'text', visible: true },
    { def: 'totalSubjects', label: 'Subjects', type: 'text', visible: true },
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
      def: 'resultStatus',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: { Pass: 'badge-success', Fail: 'badge-danger' },
    },
    { def: 'publishedDate', label: 'Date', type: 'date', visible: true },
  ];

  dataSource = new MatTableDataSource<Results>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public resultsService: ResultsService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.resultsService.getAllResults().subscribe({
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

  detailsCall(row: Results) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Results',
        type: 'Result',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
