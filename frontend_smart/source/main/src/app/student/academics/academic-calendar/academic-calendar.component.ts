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
import { AcademicCalendar } from './academic-calendar.model';
import { AcademicCalendarService } from './academic-calendar.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-academic-calendar',
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
  templateUrl: './academic-calendar.component.html',
  styleUrls: ['./academic-calendar.component.scss'],
})
export class AcademicCalendarComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'eventTitle', label: 'Event Title', type: 'text', visible: true },
    { def: 'startDate', label: 'Start Date', type: 'date', visible: true },
    { def: 'endDate', label: 'End Date', type: 'date', visible: true },
    {
      def: 'category',
      label: 'Category',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Academic: 'badge-primary',
        Holiday: 'badge-danger',
        Examination: 'badge-warning',
        Event: 'badge-success',
      },
    },
  ];

  dataSource = new MatTableDataSource<AcademicCalendar>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public academicCalendarService: AcademicCalendarService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.academicCalendarService.getAllEvents().subscribe({
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

  detailsCall(row: AcademicCalendar) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Academic Calendar',
        type: row.category || 'Calendar',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
