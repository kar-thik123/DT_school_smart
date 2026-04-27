import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { HostelFeesService } from './hostel-fees.service';
import { HostelFee } from './hostel-fees.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-hostel-fees',
  templateUrl: './hostel-fees.component.html',
  styleUrls: ['./hostel-fees.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class HostelFeesComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  hostelFeesService = inject(HostelFeesService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'invoiceNo', label: 'Invoice No', type: 'text', visible: true },
    { def: 'roomNo', label: 'Room No', type: 'text', visible: true },
    { def: 'hostelName', label: 'Hostel Name', type: 'text', visible: true },
    { def: 'feeType', label: 'Fee Type', type: 'text', visible: true },
    { def: 'amount', label: 'Amount', type: 'number', visible: true },
    { def: 'date', label: 'Date', type: 'date', visible: true },
    {
      def: 'paymentStatus',
      label: 'Payment Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Paid: 'badge-solid-green',
        Unpaid: 'badge-solid-red',
        Partial: 'badge-solid-orange',
      },
    },
  ];

  dataSource = new MatTableDataSource<HostelFee>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Hostel Fees',
      items: ['Hostel'],
      active: 'Hostel Fees',
    },
  ];

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleRefresh() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.hostelFeesService.getAllFees().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  detailsCall(row: HostelFee) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Hostel Fee Details',
        type: row.paymentStatus || 'Hostel',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
