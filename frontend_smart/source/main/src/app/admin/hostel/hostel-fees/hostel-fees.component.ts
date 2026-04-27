import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { HostelFeesService } from './hostel-fees.service';
import { HostelFee } from './hostel-fees.model';
import { rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';
import { FeeFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { FeeDeleteComponent } from './dialogs/delete/delete.component';

@Component({
  selector: 'app-hostel-fees',
  templateUrl: './hostel-fees.component.html',
  styleUrls: ['./hostel-fees.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class HostelFeesComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  feesService = inject(HostelFeesService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    {
      def: 'student_name',
      label: 'Student Name',
      type: 'nameWithImage',
      visible: true,
    },
    { def: 'roll_no', label: 'Roll No', type: 'text', visible: true },
    { def: 'hostel_name', label: 'Hostel Name', type: 'text', visible: true },
    { def: 'room_no', label: 'Room No', type: 'text', visible: true },
    { def: 'amount', label: 'Amount', type: 'text', visible: true },
    { def: 'payment_date', label: 'Payment Date', type: 'date', visible: true },
    { def: 'fee_type', label: 'Fee Type', type: 'text', visible: true },
    {
      def: 'payment_status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Paid: 'badge badge-solid-green',
        Unpaid: 'badge badge-solid-red',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<HostelFee>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Hostel Fees',
      items: ['Hostel'],
      active: 'Fees',
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
    this.feesService
      .getAllFees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  handleAdd() {
    this.openDialog('add');
  }

  handleEdit(row: HostelFee) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: HostelFee) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(FeeFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { fee: data, action },
      direction: varDirection,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (action === 'add') {
          this.dataSource.data = [result, ...this.dataSource.data];
        } else {
          this.updateRecord(result);
        }
        this.showNotification(
          action === 'add' ? 'snackbar-success' : 'black',
          `${action === 'add' ? 'Add' : 'Edit'} Record Successfully...!!!`,
          'bottom',
          'center'
        );
      }
    });
  }

  private updateRecord(updatedRecord: HostelFee) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: HostelFee) {
    const dialogRef = this.dialog.open(FeeDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.id !== row.id
        );
        this.showNotification(
          'snackbar-danger',
          'Delete Record Successfully...!!!',
          'bottom',
          'center'
        );
      }
    });
  }

  handleBulkDelete(selectedRows: HostelFee[]) {
    const totalSelect = selectedRows.length;
    this.dataSource.data = this.dataSource.data.filter(
      (item) => !selectedRows.includes(item)
    );
    this.showNotification(
      'snackbar-danger',
      `${totalSelect} Record(s) Deleted Successfully...!!!`,
      'bottom',
      'center'
    );
  }

  showNotification(
    colorName: string,
    text: string,
    placementFrom: MatSnackBarVerticalPosition,
    placementAlign: MatSnackBarHorizontalPosition
  ) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
}
