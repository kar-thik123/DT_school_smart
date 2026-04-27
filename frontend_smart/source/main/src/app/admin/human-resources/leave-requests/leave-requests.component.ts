import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { LeavesService } from './leaves.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Leaves } from './leaves.model';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { LeaveRequestFormComponent } from './form/form.component';
import { LeaveRequestDeleteComponent } from './delete/delete.component';
import { rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';

import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatTableDataSource } from '@angular/material/table';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-leave-requests',
  templateUrl: './leave-requests.component.html',
  styleUrls: ['./leave-requests.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class LeaveRequestsComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  leavesService = inject(LeavesService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    {
      def: 'name',
      label: 'Employee Name',
      type: 'nameWithImage',
      visible: true,
    },
    { def: 'employeeId', label: 'Employee ID', type: 'text', visible: true },
    { def: 'department', label: 'Department', type: 'text', visible: true },
    { def: 'type', label: 'Leave Type', type: 'text', visible: true },
    { def: 'from', label: 'Leave From', type: 'date', visible: true },
    { def: 'leaveTo', label: 'Leave To', type: 'date', visible: true },
    { def: 'noOfDays', label: 'Number of Days', type: 'text', visible: true },
    {
      def: 'durationType',
      label: 'Duration Type',
      type: 'text',
      visible: true,
    },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Approved: 'badge badge-solid-green',
        Rejected: 'badge badge-solid-orange',
        Pending: 'badge badge-solid-purple',
      },
    },
    { def: 'reason', label: 'Reason', type: 'text', visible: true },
    { def: 'note', label: 'Note', type: 'text', visible: false },
    { def: 'requestedOn', label: 'Requested On', type: 'date', visible: true },
    { def: 'approvedBy', label: 'Approved By', type: 'text', visible: true },
    {
      def: 'approvalDate',
      label: 'Approval Date',
      type: 'date',
      visible: true,
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Leaves>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

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
    this.leavesService.getAllLeaves().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: Leaves, filter: string) =>
          Object.values(data).some((value) =>
            value.toString().toLowerCase().includes(filter)
          );
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  handleAdd() {
    this.openDialog('add');
  }

  handleEdit(row: Leaves) {
    this.openDialog('edit', row);
  }

  detailsCall(row: Leaves) {
    this.dialog.open(LeaveRequestFormComponent, {
      data: {
        leaves: row,
        action: 'details',
      },
      width: '60vw',
      maxWidth: '100vw',
    });
  }

  openDialog(action: 'add' | 'edit', data?: Leaves) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(LeaveRequestFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { leaves: data, action },
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

  private updateRecord(updatedRecord: Leaves) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: Leaves) {
    const dialogRef = this.dialog.open(LeaveRequestDeleteComponent, {
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

  handleBulkDelete(selectedRows: Leaves[]) {
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
