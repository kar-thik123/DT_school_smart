import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { GradeSubmissionService } from './grade-submission.service';
import { GradeSubmission } from './grade-submission.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';

import { GradeSubmissionFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { GradeSubmissionDeleteComponent } from './dialogs/delete/delete.component';

@Component({
  selector: 'app-grade-submission',
  templateUrl: './grade-submission.component.html',
  styleUrls: ['./grade-submission.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class GradeSubmissionComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  gradeService = inject(GradeSubmissionService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'rollNo', label: 'Roll No', type: 'text', visible: true },
    { def: 'studentName', label: 'Student Name', type: 'text', visible: true },
    { def: 'averageMarks', label: 'Avg Marks', type: 'text', visible: true },
    { def: 'grade', label: 'Grade', type: 'text', visible: true },
    { def: 'submissionDate', label: 'Submission Date', type: 'text', visible: true },
    { 
      def: 'status', 
      label: 'Status', 
      type: 'status', 
      visible: true,
      statusBadgeMap: {
        'Submitted': 'badge-solid-green',
        'Draft': 'badge-solid-orange',
        'Not Started': 'badge-solid-red'
      }
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<GradeSubmission>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Grade Submission',
      items: ['Teacher', 'Examination'],
      active: 'Submission',
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
    this.gradeService.getAllGradeSubmissions().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
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

  handleEdit(row: GradeSubmission) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: GradeSubmission) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(GradeSubmissionFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { gradeSubmission: data, action },
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

  private updateRecord(updatedRecord: GradeSubmission) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: GradeSubmission) {
    const dialogRef = this.dialog.open(GradeSubmissionDeleteComponent, {
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

  handleBulkDelete(selectedRows: GradeSubmission[]) {
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

  showNotification(colorName: string, text: string, placementFrom: MatSnackBarVerticalPosition, placementAlign: MatSnackBarHorizontalPosition) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
}

