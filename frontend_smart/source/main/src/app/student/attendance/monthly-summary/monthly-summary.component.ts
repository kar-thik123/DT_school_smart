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
import { MonthlySummary } from './monthly-summary.model';
import { MonthlySummaryService } from './monthly-summary.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-monthly-summary',
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
  templateUrl: './monthly-summary.component.html',
  styleUrls: ['./monthly-summary.component.scss'],
})
export class MonthlySummaryComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'month', label: 'Month', type: 'text', visible: true },
    { def: 'totalDays', label: 'Total Days', type: 'text', visible: true },
    { def: 'present', label: 'Present', type: 'text', visible: true },
    { def: 'absent', label: 'Absent', type: 'text', visible: true },
    { def: 'late', label: 'Late', type: 'text', visible: true },
    { def: 'halfDay', label: 'Half Day', type: 'text', visible: true },
    { def: 'percentage', label: 'Percentage (%)', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<MonthlySummary>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public monthlySummaryService: MonthlySummaryService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.monthlySummaryService.getAllSummaries().subscribe({
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

  detailsCall(row: MonthlySummary) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Monthly Summary',
        type: 'Summary',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
