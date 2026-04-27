import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { FormDialogComponent } from './dialogs/form-dialog/form-dialog.component';
import { DeleteComponent } from './dialogs/delete/delete.component';
import { HallAllocationService } from './hall-allocation.service';
import { HallAllocation } from './hall-allocation.model';
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
  selector: 'app-hall-allocation',
  templateUrl: './hall-allocation.component.html',
  styleUrls: ['./hall-allocation.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class HallAllocationComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  hallAllocationService = inject(HallAllocationService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'exam_name', label: 'Exam Name', type: 'text', visible: true },
    { def: 'student_name', label: 'Student Name', type: 'text', visible: true },
    { def: 'roll_no', label: 'Roll No', type: 'text', visible: true },
    { def: 'hall_no', label: 'Hall No', type: 'text', visible: true },
    { def: 'seat_no', label: 'Seat No', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<HallAllocation>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Hall Allocation',
      items: ['Examination'],
      active: 'Hall Allocation',
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
    this.hallAllocationService.getAllHallAllocations().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: HallAllocation, filter: string) =>
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

  handleEdit(row: HallAllocation) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: HallAllocation) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(FormDialogComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { hallAllocation: data, action },
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

  private updateRecord(updatedRecord: HallAllocation) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: HallAllocation) {
    const dialogRef = this.dialog.open(DeleteComponent, {
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

  handleBulkDelete(selectedRows: HallAllocation[]) {
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

