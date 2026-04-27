import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { EntranceExamFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { EntranceExamDeleteComponent } from './dialogs/delete/delete.component';
import { EntranceExamService } from './entrance-exams.service';
import { EntranceExam } from './entrance-exams.model';
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
  selector: 'app-entrance-exams',
  templateUrl: './entrance-exams.component.html',
  styleUrls: ['./entrance-exams.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class EntranceExamsComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  entranceExamService = inject(EntranceExamService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'exam_name', label: 'Exam Name', type: 'text', visible: true },
    { def: 'exam_code', label: 'Code', type: 'text', visible: true },
    { def: 'exam_date', label: 'Date', type: 'date', visible: true },
    { def: 'start_time', label: 'Start', type: 'text', visible: true },
    { def: 'end_time', label: 'End', type: 'text', visible: true },
    { def: 'venue', label: 'Venue', type: 'text', visible: true },
    { def: 'max_marks', label: 'Max Marks', type: 'text', visible: true },
    { def: 'passing_marks', label: 'Passing', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        'Scheduled': 'badge badge-solid-blue',
        'Completed': 'badge badge-solid-green',
        'Cancelled': 'badge badge-solid-red',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<EntranceExam>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Entrance Exams',
      items: ['Admissions'],
      active: 'Exams',
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
    this.entranceExamService.getAllEntranceExams().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (
          data: EntranceExam,
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

  handleEdit(row: EntranceExam) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: EntranceExam) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(EntranceExamFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { entranceExam: data, action },
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

  private updateRecord(updatedRecord: EntranceExam) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: EntranceExam) {
    const dialogRef = this.dialog.open(EntranceExamDeleteComponent, {
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

  handleBulkDelete(selectedRows: EntranceExam[]) {
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
