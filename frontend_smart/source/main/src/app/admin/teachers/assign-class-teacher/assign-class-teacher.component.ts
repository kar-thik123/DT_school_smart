import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';

import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { Subject } from 'rxjs';
import { AssignClassTeacher } from './assign-class-teacher.model';
import { AssignClassTeacherDeleteComponent } from './dialogs/delete/delete.component';
import { AssignClassTeacherFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { AssignClassTeacherService } from './assign-class-teacher.service';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-assign-class-teacher',
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  templateUrl: './assign-class-teacher.component.html',
  styleUrl: './assign-class-teacher.component.scss',
})
export class AssignClassTeacherComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  assignClassTeacherService = inject(AssignClassTeacherService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'teacherId', label: 'Teacher ID', type: 'text', visible: true },
    {
      def: 'teacherName',
      label: 'Teacher Name',
      type: 'nameWithImage',
      visible: true,
    },
    { def: 'classId', label: 'Class ID', type: 'text', visible: true },
    { def: 'className', label: 'Class Name', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'startDate', label: 'Start Date', type: 'date', visible: false },
    { def: 'endDate', label: 'End Date', type: 'date', visible: false },
    { def: 'assignedBy', label: 'Assigned By', type: 'text', visible: false },
    {
      def: 'assignmentStatus',
      label: 'Assignment Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Active: 'badge badge-solid-green',
        Inactive: 'badge badge-solid-orange',
      },
    },
    {
      def: 'academicYear',
      label: 'Academic Year',
      type: 'text',
      visible: true,
    },
    { def: 'classTiming', label: 'Class Timing', type: 'text', visible: true },
    { def: 'roomNumber', label: 'Room No', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<AssignClassTeacher>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Assign Teacher',
      items: ['Teacher'],
      active: 'Assign Teacher',
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
    this.assignClassTeacherService.getClassTeacherAssignList().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (
          data: AssignClassTeacher,
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

  handleEdit(row: AssignClassTeacher) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: AssignClassTeacher) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AssignClassTeacherFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { assignClassTeacher: data, action },
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

  private updateRecord(updatedRecord: AssignClassTeacher) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: AssignClassTeacher) {
    const dialogRef = this.dialog.open(AssignClassTeacherDeleteComponent, {
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

  handleBulkDelete(selectedRows: AssignClassTeacher[]) {
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

