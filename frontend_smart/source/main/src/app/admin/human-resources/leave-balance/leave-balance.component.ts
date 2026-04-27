import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { TableExportUtil, rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { MatTableDataSource } from '@angular/material/table';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { LeaveBalance } from './leave-balance.model';
import { LeaveBalanceService } from './leave-balance.service';
import { LeaveBalanceFormComponent } from './form/form.component';
import { LeaveBalanceDeleteComponent } from './delete/delete.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-leave-balance',
  templateUrl: './leave-balance.component.html',
  styleUrls: ['./leave-balance.component.scss'],
  animations: [rowsAnimation],
  imports: [
    BreadcrumbComponent,
    MasterTableComponent,
  ],
})
export class LeaveBalanceComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  leaveBalanceService = inject(LeaveBalanceService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'name', label: 'Employee Name', type: 'nameWithImage', visible: true },
    { def: 'prev', label: 'Previous Balance', type: 'text', visible: true },
    { def: 'current', label: 'Current Balance', type: 'text', visible: true },
    { def: 'total', label: 'Total Balance', type: 'text', visible: true },
    { def: 'used', label: 'Used Leave', type: 'text', visible: true },
    { def: 'accepted', label: 'Accepted Leave', type: 'text', visible: true },
    { def: 'rejected', label: 'Rejected Leave', type: 'text', visible: true },
    { def: 'expired', label: 'Expired Leave', type: 'text', visible: true },
    {
      def: 'carryOver',
      label: 'Carry Over Balance',
      type: 'text',
      visible: true,
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<LeaveBalance>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh() {
    this.loadData();
  }

  loadData() {
    this.leaveBalanceService.getAllLeaveBalances().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => console.error(err),
    });
  }

  addNew() {
    this.openDialog('add');
  }

  editCall(row: LeaveBalance) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: LeaveBalance) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(LeaveBalanceFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { leaveBalance: data, action },
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

  private updateRecord(updatedRecord: LeaveBalance) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  deleteItem(row: LeaveBalance) {
    const dialogRef = this.dialog.open(LeaveBalanceDeleteComponent, {
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

  exportExcel() {
    const exportData = this.dataSource.filteredData.map((x) => ({
      ID: x.id,
      'Employee Name': x.name,
      'Previous Balance': x.prev,
      'Current Balance': x.current,
      'Total Balance': x.total,
      'Used Leave': x.used,
      'Accepted Leave': x.accepted,
      'Rejected Leave': x.rejected,
      'Expired Leave': x.expired,
      'Carry Over Balance': x.carryOver,
    }));

    TableExportUtil.exportToExcel(exportData, 'leave_balance_export');
  }

  handleBulkDelete(selectedRows: LeaveBalance[]) {
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
}
