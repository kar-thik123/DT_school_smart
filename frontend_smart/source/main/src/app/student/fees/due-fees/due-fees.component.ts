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
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';
import { DueFees } from './due-fees.model';
import { DueFeesService } from './due-fees.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-due-fees',
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
  templateUrl: './due-fees.component.html',
  styleUrls: ['./due-fees.component.scss'],
})
export class DueFeesComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'feeType', label: 'Fee Type', type: 'text', visible: true },
    { def: 'dueDate', label: 'Due Date', type: 'date', visible: true },
    { def: 'totalAmount', label: 'Total Amount', type: 'text', visible: true },
    { def: 'dueAmount', label: 'Due Amount', type: 'text', visible: true },
    { def: 'lateFee', label: 'Late Fee', type: 'text', visible: true },
    { def: 'totalDue', label: 'Total Due', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<DueFees>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public dueFeesService: DueFeesService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dueFeesService.getAllDueFees().subscribe({
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

  detailsCall(row: DueFees) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Due Fee',
        type: 'Fee',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
