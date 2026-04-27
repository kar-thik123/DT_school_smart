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
import { Marks } from './marks.model';
import { MarksService } from './marks.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-marks',
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
  templateUrl: './marks.component.html',
  styleUrls: ['./marks.component.scss'],
})
export class MarksComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'examName', label: 'Exam Name', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    {
      def: 'obtainedMarks',
      label: 'Obtained Marks',
      type: 'text',
      visible: true,
    },
    { def: 'totalMarks', label: 'Total Marks', type: 'text', visible: true },
    {
      def: 'grade',
      label: 'Grade',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        'A+': 'badge-success',
        A: 'badge-primary',
        'A-': 'badge-info',
        'B+': 'badge-warning',
        B: 'badge-warning',
        'C+': 'badge-danger',
      },
    },
    { def: 'remarks', label: 'Remarks', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<Marks>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public marksService: MarksService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.marksService.getAllMarks().subscribe({
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

  detailsCall(row: Marks) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Marks',
        type: 'Marks',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
