import { Direction } from '@angular/cdk/bidi';

import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarVerticalPosition,
  MatSnackBarHorizontalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { Subject } from 'rxjs';
import { AllClassListsDeleteComponent } from './dialogs/delete/delete.component';
import { AllClassListsFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { ClassList } from './class-list.model';
import { ClassListService } from './class-list.service';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';
import { LocalStorageService } from '@shared/services';

@Component({
  selector: 'app-class-list',
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  templateUrl: './class-list.component.html',
  styleUrl: './class-list.component.scss',
})
export class ClassListComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  classListService = inject(ClassListService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'classId', label: 'Class ID', type: 'text', visible: false },
    { def: 'className', label: 'Class Name', type: 'text', visible: true },
    { def: 'classCode', label: 'Class Code', type: 'text', visible: true },
    { def: 'classType', label: 'Class Type', type: 'text', visible: true },
    { def: 'teacherId', label: 'Teacher ID', type: 'text', visible: false },
    { def: 'roomNumber', label: 'Room Number', type: 'text', visible: true },
    { def: 'schedule', label: 'Schedule', type: 'text', visible: true },
    { def: 'semester', label: 'Semester', type: 'text', visible: true },
    { def: 'classCapacity', label: 'Capacity', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Active: 'badge badge-solid-green',
        Inactive: 'badge badge-solid-orange',
      },
    },
    { def: 'startDate', label: 'Start Date', type: 'date', visible: true },
    { def: 'endDate', label: 'End Date', type: 'date', visible: true },
    { def: 'description', label: 'Description', type: 'text', visible: false },
    { def: 'createdAt', label: 'Created Date', type: 'date', visible: false },
    { def: 'updatedAt', label: 'Updated Date', type: 'date', visible: false },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<ClassList>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Class List',
      items: ['Class'],
      active: 'Class List',
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
    this.classListService.getAllClasses().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: ClassList, filter: string) =>
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

  handleEdit(row: ClassList) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: ClassList) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AllClassListsFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { classList: data, action },
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

  private updateRecord(updatedRecord: ClassList) {
    const index = this.dataSource.data.findIndex(
      (record) => record.classId === updatedRecord.classId
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: ClassList) {
    const dialogRef = this.dialog.open(AllClassListsDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.classId !== row.classId
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

  handleBulkDelete(selectedRows: ClassList[]) {
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
