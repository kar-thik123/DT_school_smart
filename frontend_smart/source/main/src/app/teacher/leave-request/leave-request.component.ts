import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequest } from './leave-request.model';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TeacherLeaveRequestFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { TeacherLeaveRequestDeleteComponent } from './dialogs/delete/delete.component';
import { HttpClient } from '@angular/common/http';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-leave-request',
  templateUrl: './leave-request.component.html',
  styleUrls: ['./leave-request.component.scss'],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class LeaveRequestComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  leaveRequestService = inject(LeaveRequestService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'leaveId', label: 'Leave ID', type: 'text', visible: false },
    { def: 'leaveType', label: 'Leave Type', type: 'text', visible: true },
    { def: 'startDate', label: 'Start Date', type: 'text', visible: true },
    { def: 'endDate', label: 'End Date', type: 'text', visible: true },
    { def: 'totalDays', label: 'Total Days', type: 'text', visible: true },
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
    {
      def: 'dateSubmitted',
      label: 'Date Submitted',
      type: 'text',
      visible: true,
    },
    {
      def: 'reasonForLeave',
      label: 'Reason for Leave',
      type: 'text',
      visible: true,
    },
    { def: 'approver', label: 'Approver', type: 'text', visible: true },
    { def: 'comments', label: 'Comments', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<LeaveRequest>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'All LeaveRequest',
      items: ['LeaveRequest'],
      active: 'All',
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
    this.leaveRequestService.getAllLeaveRequests().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (
          data: LeaveRequest,
          filter: string
        ) =>
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

  handleEdit(row: LeaveRequest) {
    this.openDialog('edit', row);
  }

  detailsCall(row: LeaveRequest) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    this.dialog.open(TeacherLeaveRequestFormComponent, {
      data: {
        leaveRequest: row,
        action: 'details',
      },
      width: '60vw',
      maxWidth: '100vw',
      direction: varDirection,
    });
  }

  openDialog(action: 'add' | 'edit', data?: LeaveRequest) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(TeacherLeaveRequestFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { leaveRequest: data, action },
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

  private updateRecord(updatedRecord: LeaveRequest) {
    const index = this.dataSource.data.findIndex(
      (record) => record.leaveId === updatedRecord.leaveId
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: LeaveRequest) {
    const dialogRef = this.dialog.open(TeacherLeaveRequestDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.leaveId !== row.leaveId
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

  handleBulkDelete(selectedRecords: LeaveRequest[]) {
    const totalSelect = selectedRecords.length;
    this.dataSource.data = this.dataSource.data.filter(
      (item) => !selectedRecords.includes(item)
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

