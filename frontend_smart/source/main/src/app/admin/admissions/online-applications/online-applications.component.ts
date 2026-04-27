import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { OnlineApplicationFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { OnlineApplicationDeleteComponent } from './dialogs/delete/delete.component';
import { OnlineApplicationService } from './online-applications.service';
import { OnlineApplication } from './online-applications.model';
import { rowsAnimation } from '@shared';
import { HttpClient } from '@angular/common/http';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-online-applications',
  templateUrl: './online-applications.component.html',
  styleUrls: ['./online-applications.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class OnlineApplicationsComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  onlineApplicationService = inject(OnlineApplicationService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'student_name', label: 'Student Name', type: 'nameWithImage', visible: true },
    { def: 'application_no', label: 'App No', type: 'text', visible: true },
    { def: 'email', label: 'Email', type: 'text', visible: true },
    { def: 'mobile', label: 'Mobile', type: 'text', visible: true },
    { def: 'course', label: 'Course', type: 'text', visible: true },
    { def: 'application_date', label: 'App Date', type: 'date', visible: true },
    {
      def: 'payment_status',
      label: 'Payment',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        'Paid': 'badge badge-solid-green',
        'Unpaid': 'badge badge-solid-red',
      },
    },
    {
      def: 'application_status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        'Approved': 'badge badge-solid-green',
        'Pending': 'badge badge-solid-orange',
        'Under Review': 'badge badge-solid-blue',
        'Draft': 'badge badge-solid-brown',
        'Rejected': 'badge badge-solid-red',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<OnlineApplication>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Online Applications',
      items: ['Admissions'],
      active: 'Applications',
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
    this.onlineApplicationService.getAllOnlineApplications().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (
          data: OnlineApplication,
          filter: string
        ) =>
          Object.values(data).some((value) =>
            value ? value.toString().toLowerCase().includes(filter) : false
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

  handleEdit(row: OnlineApplication) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: OnlineApplication) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(OnlineApplicationFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { onlineApplication: data, action },
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

  private updateRecord(updatedRecord: OnlineApplication) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: OnlineApplication) {
    const dialogRef = this.dialog.open(OnlineApplicationDeleteComponent, {
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

  handleBulkDelete(selectedRows: OnlineApplication[]) {
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
