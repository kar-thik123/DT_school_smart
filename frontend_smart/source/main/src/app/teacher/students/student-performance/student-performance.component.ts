import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { StudentPerformanceService } from './student-performance.service';
import { StudentPerformance } from './student-performance.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';

import { StudentPerformanceFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { StudentPerformanceDeleteComponent } from './dialogs/delete/delete.component';

@Component({
  selector: 'app-student-performance',
  templateUrl: './student-performance.component.html',
  styleUrls: ['./student-performance.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class StudentPerformanceComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  performanceService = inject(StudentPerformanceService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'rollNo', label: 'Roll No', type: 'text', visible: true },
    { def: 'name', label: 'Name', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'internalMarks', label: 'Internal', type: 'text', visible: true },
    { def: 'externalMarks', label: 'External', type: 'text', visible: true },
    { def: 'totalMarks', label: 'Total', type: 'text', visible: true },
    { 
      def: 'grade', 
      label: 'Grade', 
      type: 'text', 
      visible: true 
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<StudentPerformance>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Student Performance',
      items: ['Teacher', 'Students'],
      active: 'Performance',
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
    this.performanceService.getAllPerformance().subscribe({
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

  handleEdit(row: StudentPerformance) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: StudentPerformance) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(StudentPerformanceFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { performance: data, action },
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

  private updateRecord(updatedRecord: StudentPerformance) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: StudentPerformance) {
    const dialogRef = this.dialog.open(StudentPerformanceDeleteComponent, {
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

  handleBulkDelete(selectedRows: StudentPerformance[]) {
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

