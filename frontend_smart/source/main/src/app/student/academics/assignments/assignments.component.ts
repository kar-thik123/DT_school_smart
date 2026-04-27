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
import { Assignment } from './assignments.model';
import { AssignmentsService } from './assignments.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-assignments',
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
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss'],
})
export class AssignmentsComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'title', label: 'Assignment Title', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    {
      def: 'assignedDate',
      label: 'Assigned Date',
      type: 'date',
      visible: true,
    },
    { def: 'dueDate', label: 'Due Date', type: 'date', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Submitted: 'badge-success',
        Pending: 'badge-warning',
        Late: 'badge-danger',
      },
    },
  ];

  dataSource = new MatTableDataSource<Assignment>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public assignmentsService: AssignmentsService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.assignmentsService.getAllAssignments().subscribe({
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

  detailsCall(row: Assignment) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Assignment',
        type: row.status || 'Assignment',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
