import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { LeaveTypesService } from './leave-types.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { LeaveTypes } from './leave-types.model';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { Subject } from 'rxjs';
import { LeaveTypesFormComponent } from './form/form.component';
import { LeaveRequestDeleteComponent } from './delete/delete.component';
import { rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MasterTableComponent } from '@shared/components/master-table/master-table.component';
import { ColumnDefinition } from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-leave-types',
  templateUrl: './leave-types.component.html',
  styleUrls: ['./leave-types.component.scss'],
  animations: [rowsAnimation],
  imports: [
    BreadcrumbComponent,
    FormsModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatRippleModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatPaginatorModule,
    MasterTableComponent,
  ],
})
export class LeaveTypesComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  leaveTypesService = inject(LeaveTypesService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'leave_name', label: 'Leave Name', type: 'text', visible: true },
    { def: 'type', label: 'Leave Type', type: 'text', visible: true },
    { def: 'leave_unit', label: 'Leave Unit', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Active: 'badge-solid-green',
        Deactive: 'badge-solid-orange',
      },
    },
    { def: 'note', label: 'Note', type: 'text', visible: false },
    { def: 'duration', label: 'Duration (Days)', type: 'text', visible: true },
    { def: 'created_by', label: 'Created By', type: 'text', visible: true },
    {
      def: 'carry_over',
      label: 'Carry Over Policy',
      type: 'text',
      visible: false,
    },
    {
      def: 'notification_period',
      label: 'Notification Period',
      type: 'text',
      visible: true,
    },
    {
      def: 'max_leaves',
      label: 'Maximum Leaves',
      type: 'text',
      visible: false,
    },
    {
      def: 'annual_limit',
      label: 'Annual Limit',
      type: 'text',
      visible: false,
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<LeaveTypes>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.leaveTypesService.getAllLeaveTypes().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => console.error(err),
    });
  }

  handleAdd() {
    this.openDialog('add');
  }

  handleEdit(row: LeaveTypes) {
    this.openDialog('edit', row);
  }

  handleRefresh() {
    this.loadData();
  }

  openDialog(action: 'add' | 'edit', data?: LeaveTypes) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(LeaveTypesFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { leaveTypes: data, action },
      direction: varDirection,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(JSON.stringify(result));
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

  private updateRecord(updatedRecord: LeaveTypes) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: LeaveTypes) {
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

  handleBulkDelete(selectedRows: LeaveTypes[]) {
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
