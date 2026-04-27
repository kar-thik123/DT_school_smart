import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { StaffAttendanceFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { StaffAttendanceDeleteComponent } from './dialogs/delete/delete.component';
import { StaffAttendanceService } from './staff-attendance.service';
import { StaffAttendance } from './staff-attendance.model';
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
  selector: 'app-staff-attendance',
  templateUrl: './staff-attendance.component.html',
  styleUrls: ['./staff-attendance.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class StaffAttendanceComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  staffAttendanceService = inject(StaffAttendanceService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'employee_id', label: 'Employee ID', type: 'text', visible: true },
    {
      def: 'name',
      label: 'Name',
      type: 'nameWithImage',
      visible: true,
    },
    { def: 'designation', label: 'Designation', type: 'text', visible: true },
    { def: 'date', label: 'Date', type: 'date', visible: true },
    { def: 'check_in', label: 'Check In', type: 'text', visible: true },
    { def: 'break', label: 'Break', type: 'text', visible: true },
    { def: 'check_out', label: 'Check Out', type: 'text', visible: true },
    { def: 'total', label: 'Total Hours', type: 'text', visible: true },
    { def: 'department', label: 'Department', type: 'text', visible: true },
    { def: 'shift', label: 'Shift', type: 'text', visible: true },
    {
      def: 'late_arrival',
      label: 'Late Arrival',
      type: 'text',
      visible: false,
    },
    {
      def: 'early_departure',
      label: 'Early Departure',
      type: 'text',
      visible: false,
    },
    {
      def: 'absence_reason',
      label: 'Absence Reason',
      type: 'text',
      visible: false,
    },
    { def: 'overtime', label: 'Overtime', type: 'text', visible: false },
    {
      def: 'total_breaks',
      label: 'Total Breaks',
      type: 'text',
      visible: false,
    },
    { def: 'remarks', label: 'Remarks', type: 'text', visible: false },
    {
      def: 'attendance_status',
      label: 'Attendance Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Present: 'badge badge-solid-green',
        Absent: 'badge badge-solid-orange',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<StaffAttendance>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Staff Attendance',
      items: ['Attendance'],
      active: 'Staff Attendance',
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
    this.staffAttendanceService.getAllStaffAttendances().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (
          data: StaffAttendance,
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

  handleEdit(row: StaffAttendance) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: StaffAttendance) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(StaffAttendanceFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { staffAttendance: data, action },
      direction: varDirection,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
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

  private updateRecord(updatedRecord: StaffAttendance) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: StaffAttendance) {
    const dialogRef = this.dialog.open(StaffAttendanceDeleteComponent, {
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

  handleBulkDelete(selectedRows: StaffAttendance[]) {
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
