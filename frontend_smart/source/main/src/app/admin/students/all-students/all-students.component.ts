import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { StudentsFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { StudentsDeleteComponent } from './dialogs/delete/delete.component';
import { StudentsService } from './students.service';
import { Students } from './students.model';
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
  selector: 'app-all-students',
  templateUrl: './all-students.component.html',
  styleUrls: ['./all-students.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class AllStudentsComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  studentsService = inject(StudentsService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'rollNo', label: 'Roll No', type: 'text', visible: true },
    {
      def: 'name',
      label: 'Name',
      type: 'nameWithImage',
      visible: true,
    },
    { def: 'email', label: 'Email', type: 'email', visible: true },
    {
      def: 'gender',
      label: 'Gender',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        male: 'badge badge-solid-green',
        female: 'badge badge-solid-purple',
      },
    },
    { def: 'mobile', label: 'Mobile', type: 'phone', visible: true },
    { def: 'department', label: 'Department', type: 'text', visible: true },
    {
      def: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date',
      visible: true,
    },
    { def: 'address', label: 'Address', type: 'address', visible: true },
    {
      def: 'enrollment_date',
      label: 'Enrollment Date',
      type: 'date',
      visible: false,
    },
    {
      def: 'graduation_year',
      label: 'Graduation Year',
      type: 'text',
      visible: false,
    },
    {
      def: 'parent_guardian_name',
      label: 'Parent/Guardian Name',
      type: 'text',
      visible: false,
    },
    {
      def: 'parent_guardian_mobile',
      label: 'Parent/Guardian Mobile',
      type: 'text',
      visible: true,
    },
    { def: 'status', label: 'Status', type: 'text', visible: false },
    {
      def: 'profile_completion_status',
      label: 'Profile Completion',
      type: 'text',
      visible: true,
    },
    {
      def: 'scholarship_status',
      label: 'Scholarship Status',
      type: 'text',
      visible: false,
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Students>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'All Student',
      items: ['Student'],
      active: 'All Student',
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
    this.studentsService.getAllStudents().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: Students, filter: string) =>
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

  handleEdit(row: Students) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: Students) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(StudentsFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { student: data, action },
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

  private updateRecord(updatedRecord: Students) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: Students) {
    const dialogRef = this.dialog.open(StudentsDeleteComponent, {
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

  handleBulkDelete(selectedRows: Students[]) {
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
