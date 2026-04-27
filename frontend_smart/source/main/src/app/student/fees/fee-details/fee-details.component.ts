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
import { FeeDetails } from './fee-details.model';
import { FeeDetailsService } from './fee-details.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-fee-details',
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
  templateUrl: './fee-details.component.html',
  styleUrls: ['./fee-details.component.scss'],
})
export class FeeDetailsComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'feeType', label: 'Fee Type', type: 'text', visible: true },
    { def: 'dueDate', label: 'Due Date', type: 'date', visible: true },
    { def: 'amount', label: 'Amount', type: 'text', visible: true },
    { def: 'paidAmount', label: 'Paid Amount', type: 'text', visible: true },
    { def: 'balanceAmount', label: 'Balance', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Paid: 'badge-solid-green',
        Unpaid: 'badge-solid-red',
        Partial: 'badge-solid-orange',
      },
    },
    {
      def: 'paymentMethod',
      label: 'Payment Method',
      type: 'text',
      visible: true,
    },
  ];

  dataSource = new MatTableDataSource<FeeDetails>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public feeDetailsService: FeeDetailsService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.feeDetailsService.getAllFeeDetails().subscribe({
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

  detailsCall(row: FeeDetails) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Fee Details',
        type: row.status || 'Details',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
