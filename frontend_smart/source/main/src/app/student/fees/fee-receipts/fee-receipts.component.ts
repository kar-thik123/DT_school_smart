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
import { FeeReceipt } from './fee-receipts.model';
import { FeeReceiptsService } from './fee-receipts.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-fee-receipts',
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
  templateUrl: './fee-receipts.component.html',
  styleUrls: ['./fee-receipts.component.scss'],
})
export class FeeReceiptsComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'receiptNo', label: 'Receipt No', type: 'text', visible: true },
    { def: 'feeType', label: 'Fee Type', type: 'text', visible: true },
    { def: 'paymentDate', label: 'Payment Date', type: 'date', visible: true },
    { def: 'paidAmount', label: 'Paid Amount', type: 'text', visible: true },
    { def: 'paymentMode', label: 'Payment Mode', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Success: 'badge-solid-green',
        Printed: 'badge-solid-blue',
        Cancelled: 'badge-solid-red',
      },
    },
  ];

  dataSource = new MatTableDataSource<FeeReceipt>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public feeReceiptsService: FeeReceiptsService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.feeReceiptsService.getAllFeeReceipts().subscribe({
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

  detailsCall(row: FeeReceipt) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Fee Receipt',
        type: row.status || 'Receipt',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
