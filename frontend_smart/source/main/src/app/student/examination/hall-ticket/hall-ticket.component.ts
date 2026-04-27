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
import { HallTicket } from './hall-ticket.model';
import { HallTicketService } from './hall-ticket.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-hall-ticket',
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
  templateUrl: './hall-ticket.component.html',
  styleUrls: ['./hall-ticket.component.scss'],
})
export class HallTicketComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'examName', label: 'Exam Name', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'examDate', label: 'Exam Date', type: 'date', visible: true },
    { def: 'startTime', label: 'Start Time', type: 'text', visible: true },
    { def: 'roomNo', label: 'Room No', type: 'text', visible: true },
    { def: 'rollNo', label: 'Roll No', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<HallTicket>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public hallTicketService: HallTicketService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.hallTicketService.getAllTickets().subscribe({
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

  detailsCall(row: HallTicket) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Hall Ticket',
        type: 'Ticket',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
