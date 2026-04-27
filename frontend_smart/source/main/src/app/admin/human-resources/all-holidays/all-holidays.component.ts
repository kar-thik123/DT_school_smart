import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HolidayService } from './all-holidays.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { AllHoliday } from './all-holidays.model';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { TableExportUtil, rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { formatDate } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AllHolidaysFormComponent } from './dialog/form-dialog/form-dialog.component';
import { AllHolidaysDeleteComponent } from './dialog/delete/delete.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-allholiday',
  templateUrl: './all-holidays.component.html',
  styleUrls: ['./all-holidays.component.scss'],
  animations: [rowsAnimation],
  imports: [
    BreadcrumbComponent,
    MasterTableComponent,
  ],
})
export class AllHolidayComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  holidayService = inject(HolidayService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'holidayName', label: 'Holiday Name', type: 'text', visible: true },
    { def: 'shift', label: 'Shift', type: 'text', visible: true },
    { def: 'date', label: 'Date', type: 'date', visible: true },
    { def: 'location', label: 'Location', type: 'text', visible: false },
    { def: 'holidayType', label: 'Holiday Type', type: 'text', visible: true },
    { def: 'createdBy', label: 'Created By', type: 'text', visible: true },
    {
      def: 'creationDate',
      label: 'Creation Date',
      type: 'date',
      visible: true,
    },
    {
      def: 'approvalStatus',
      label: 'Approval Status',
      type: 'text',
      visible: true,
    },
    { def: 'details', label: 'Details', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<AllHoliday>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh() {
    this.loadData();
  }

  loadData() {
    this.holidayService.getAllHolidays().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => console.error(err),
    });
  }

  addNew() {
    this.openDialog('add');
  }

  editCall(row: AllHoliday) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: AllHoliday) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AllHolidaysFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { allHoliday: data, action },
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

  private updateRecord(updatedRecord: AllHoliday) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  deleteItem(row: AllHoliday) {
    const dialogRef = this.dialog.open(AllHolidaysDeleteComponent, {
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

  exportExcel() {
    const exportData = this.dataSource.filteredData.map((x) => ({
      ID: x.id,
      'Holiday Name': x.holidayName,
      Shift: x.shift,
      Details: x.details,
      Date: formatDate(new Date(x.date), 'yyyy-MM-dd', 'en') || '',
      Location: x.location,
      'Holiday Type': x.holidayType,
      'Created By': x.createdBy,
      'Creation Date':
        formatDate(new Date(x.creationDate), 'yyyy-MM-dd', 'en') || '',
      'Approval Status': x.approvalStatus,
    }));

    TableExportUtil.exportToExcel(exportData, 'holidays_export');
  }

  removeSelectedRows(selectedRows: AllHoliday[]) {
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
}
