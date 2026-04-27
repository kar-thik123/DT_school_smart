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
import { OnlinePayment } from './online-payment.model';
import { OnlinePaymentService } from './online-payment.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-online-payment',
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
  templateUrl: './online-payment.component.html',
  styleUrls: ['./online-payment.component.scss'],
})
export class OnlinePaymentComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    {
      def: 'transactionId',
      label: 'Transaction ID',
      type: 'text',
      visible: true,
    },
    { def: 'feeType', label: 'Fee Type', type: 'text', visible: true },
    { def: 'paymentDate', label: 'Payment Date', type: 'date', visible: true },
    { def: 'amount', label: 'Amount', type: 'text', visible: true },
    { def: 'paymentGateway', label: 'Gateway', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Success: 'badge-solid-green',
        Pending: 'badge-solid-orange',
        Failed: 'badge-solid-red',
        Refunded: 'badge-solid-blue',
      },
    },
  ];

  dataSource = new MatTableDataSource<OnlinePayment>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public onlinePaymentService: OnlinePaymentService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.onlinePaymentService.getAllOnlinePayments().subscribe({
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

  detailsCall(row: OnlinePayment) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Online Payment',
        type: row.status || 'Payment',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
