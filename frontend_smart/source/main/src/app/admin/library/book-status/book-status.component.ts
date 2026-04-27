import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { BookStatusDeleteComponent } from './dialogs/delete/delete.component';
import { BookStatusFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { BookStatus } from './book-status.model';
import { BookStatusService } from './book-status.service';
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
  selector: 'app-book-status',
  templateUrl: './book-status.component.html',
  styleUrls: ['./book-status.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class BookStatusComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  bookStatusService = inject(BookStatusService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    {
      def: 'bookStatusID',
      label: 'Book Status ID',
      type: 'text',
      visible: false,
    },
    { def: 'bookID', label: 'Book ID', type: 'text', visible: true },
    { def: 'bookName', label: 'Book Name', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Available: 'badge badge-solid-green',
        'Checked Out': 'badge badge-solid-purple',
        Reserved: 'badge badge-solid-blue',
        'Under Repair': 'badge badge-solid-brown',
        Lost: 'badge badge-solid-orange',
      },
    },
    { def: 'dateUpdated', label: 'Date Updated', type: 'date', visible: true },
    {
      def: 'lastCheckedOutDate',
      label: 'Last Checked Out',
      type: 'date',
      visible: true,
    },
    { def: 'dueDate', label: 'Due Date', type: 'date', visible: true },
    {
      def: 'checkedOutBy',
      label: 'Checked Out By',
      type: 'text',
      visible: true,
    },
    { def: 'reservedBy', label: 'Reserved By', type: 'text', visible: true },
    { def: 'condition', label: 'Condition', type: 'text', visible: true },
    { def: 'returnDate', label: 'Return Date', type: 'date', visible: true },
    { def: 'notes', label: 'Notes', type: 'text', visible: false },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<BookStatus>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Book Status',
      items: ['Library'],
      active: 'Book Status',
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
    this.bookStatusService.getBookStatuses().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: BookStatus, filter: string) =>
          Object.values(data).some(
            (value) => value && value.toString().toLowerCase().includes(filter)
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

  handleEdit(row: BookStatus) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: BookStatus) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(BookStatusFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { bookStatus: data, action },
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

  private updateRecord(updatedRecord: BookStatus) {
    const index = this.dataSource.data.findIndex(
      (record) => record.bookStatusID === updatedRecord.bookStatusID
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: BookStatus) {
    const dialogRef = this.dialog.open(BookStatusDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.bookStatusID !== row.bookStatusID
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

  handleBulkDelete(selectedRows: BookStatus[]) {
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
