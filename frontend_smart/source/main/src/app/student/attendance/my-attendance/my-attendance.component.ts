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
import { MyAttendance } from './my-attendance.model';
import { MyAttendanceService } from './my-attendance.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-my-attendance',
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
  templateUrl: './my-attendance.component.html',
  styleUrls: ['./my-attendance.component.scss'],
})
export class MyAttendanceComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'date', label: 'Date', type: 'date', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Present: 'badge-success',
        Absent: 'badge-danger',
        Late: 'badge-warning',
        'Half Day': 'badge-primary',
      },
    },
    { def: 'checkIn', label: 'Check In', type: 'text', visible: true },
    { def: 'checkOut', label: 'Check Out', type: 'text', visible: true },
    {
      def: 'workingHours',
      label: 'Working Hours',
      type: 'text',
      visible: true,
    },
    { def: 'remarks', label: 'Remarks', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<MyAttendance>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public myAttendanceService: MyAttendanceService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.myAttendanceService.getAllAttendance().subscribe({
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

  detailsCall(row: MyAttendance) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Attendance',
        type: row.status || 'Attendance',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
