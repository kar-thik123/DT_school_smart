import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { TeachersFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { TeachersDeleteComponent } from './dialogs/delete/delete.component';
import { TeachersService } from './teachers.service';
import { Teachers } from './teachers.model';
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
  selector: 'app-all-teachers',
  templateUrl: './all-teachers.component.html',
  styleUrls: ['./all-teachers.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class AllTeachersComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  teachersService = inject(TeachersService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    {
      def: 'name',
      label: 'Name',
      type: 'nameWithImage',
      visible: true,
    },
    { def: 'department', label: 'Department', type: 'text', visible: true },
    { def: 'email', label: 'Email', type: 'email', visible: true },
    {
      def: 'gender',
      label: 'Gender',
      type: 'status', // Using status to leverage badge map, or custom? Let's use status with map.
      visible: true,
      statusBadgeMap: {
        male: 'badge badge-solid-green',
        female: 'badge badge-solid-purple',
      },
    },
    { def: 'mobile', label: 'Mobile', type: 'phone', visible: true },
    { def: 'degree', label: 'Degree', type: 'text', visible: true },
    { def: 'address', label: 'Address', type: 'address', visible: true },
    { def: 'hire_date', label: 'Hire Date', type: 'date', visible: true },
    { def: 'salary', label: 'Salary', type: 'text', visible: true },
    {
      def: 'subject_specialization',
      label: 'Specialization',
      type: 'text',
      visible: false,
    },
    {
      def: 'experience_years',
      label: 'Experience (Years)',
      type: 'text',
      visible: false,
    },
    { def: 'status', label: 'Status', type: 'text', visible: false },
    { def: 'birthdate', label: 'Birthdate', type: 'date', visible: false },
    { def: 'bio', label: 'Bio', type: 'text', visible: false },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Teachers>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'All Teacher',
      items: ['Teacher'],
      active: 'All Teacher',
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
    this.teachersService.getAllTeachers().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: Teachers, filter: string) =>
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

  handleEdit(row: Teachers) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: Teachers) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(TeachersFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { teachers: data, action },
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

  private updateRecord(updatedRecord: Teachers) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: Teachers) {
    const dialogRef = this.dialog.open(TeachersDeleteComponent, {
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

  handleBulkDelete(selectedRows: Teachers[]) {
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
