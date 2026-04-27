import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { LectureFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { LectureDeleteComponent } from './dialogs/delete/delete.component';
import { LecturesService } from './lectures.service';
import { Lectures } from './lectures.model';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { HttpClient } from '@angular/common/http';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-lectures',
  templateUrl: './lectures.component.html',
  styleUrls: ['./lectures.component.scss'],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class LecturesComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  lecturesService = inject(LecturesService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'subjectName', label: 'Subject Name', type: 'text', visible: true },
    { def: 'class', label: 'Class', type: 'text', visible: true },
    { def: 'date', label: 'Date', type: 'text', visible: true },
    { def: 'time', label: 'Time', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Confirm: 'badge badge-solid-green',
        Cancelled: 'badge badge-solid-red',
      },
    },
    { def: 'teacher_id', label: 'Teacher ID', type: 'text', visible: false },
    { def: 'subject_id', label: 'Subject ID', type: 'text', visible: false },
    {
      def: 'student_group',
      label: 'Student Group',
      type: 'text',
      visible: true,
    },
    {
      def: 'duration',
      label: 'Duration (Minutes)',
      type: 'text',
      visible: true,
    },
    { def: 'location', label: 'Location', type: 'text', visible: true },
    {
      def: 'attendance_count',
      label: 'Attendance Count',
      type: 'text',
      visible: true,
    },
    { def: 'created_at', label: 'Created At', type: 'text', visible: false },
    { def: 'updated_at', label: 'Updated At', type: 'text', visible: false },
    {
      def: 'reason_for_cancellation',
      label: 'Reason for Cancellation',
      type: 'text',
      visible: true,
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Lectures>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Lecture',
      items: ['Teacher'],
      active: 'Lecture',
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
    this.lecturesService.getAllLectures().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: Lectures, filter: string) =>
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

  handleEdit(row: Lectures) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: Lectures) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(LectureFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { lectures: data, action },
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

  private updateRecord(updatedRecord: Lectures) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: Lectures) {
    const dialogRef = this.dialog.open(LectureDeleteComponent, {
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

  handleBulkDelete(selectedRecords: Lectures[]) {
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
