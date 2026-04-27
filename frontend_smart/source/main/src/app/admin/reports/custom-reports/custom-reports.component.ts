import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { CustomReportFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { CustomReportDeleteComponent } from './dialogs/delete/delete.component';
import { CustomReportService } from './custom-report.service';
import { CustomReport } from './custom-report.model';
import { rowsAnimation } from '@shared';
import { HttpClient } from '@angular/common/http';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-reports',
  templateUrl: './custom-reports.component.html',
  styleUrls: ['./custom-reports.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent, CommonModule],
})
export class CustomReportsComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  customReportService = inject(CustomReportService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'reportName', label: 'Report Name', type: 'text', visible: true },
    { def: 'description', label: 'Description', type: 'text', visible: true },
    { def: 'category', label: 'Category', type: 'text', visible: true },
    { def: 'createdBy', label: 'Created By', type: 'text', visible: true },
    { def: 'date', label: 'Date', type: 'date', visible: true },
    { def: 'status', label: 'Status', type: 'status', visible: true, statusBadgeMap: { 'Active': 'badge-solid-green', 'Draft': 'badge-solid-orange', 'Archived': 'badge-solid-blue' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<CustomReport>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [{ title: 'Custom Reports', items: ['Reports'], active: 'Custom Reports' }];

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
    this.customReportService.getAllCustomReports().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: CustomReport, filter: string) =>
          Object.values(data).some((value) => value.toString().toLowerCase().includes(filter));
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

  handleEdit(row: CustomReport) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: CustomReport) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(CustomReportFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { customReport: data, action },
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
        this.showNotification(action === 'add' ? 'snackbar-success' : 'black', `${action === 'add' ? 'Add' : 'Edit'} Record Successfully...!!!`, 'bottom', 'center');
      }
    });
  }

  private updateRecord(updatedRecord: CustomReport) {
    const index = this.dataSource.data.findIndex((record) => record.id === updatedRecord.id);
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: CustomReport) {
    const dialogRef = this.dialog.open(CustomReportDeleteComponent, { data: row });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter((record) => record.id !== row.id);
        this.showNotification('snackbar-danger', 'Delete Record Successfully...!!!', 'bottom', 'center');
      }
    });
  }

  handleBulkDelete(selectedRows: CustomReport[]) {
    const totalSelect = selectedRows.length;
    this.dataSource.data = this.dataSource.data.filter((item) => !selectedRows.includes(item));
    this.showNotification('snackbar-danger', `${totalSelect} Record(s) Deleted Successfully...!!!`, 'bottom', 'center');
  }

  showNotification(colorName: string, text: string, placementFrom: MatSnackBarVerticalPosition, placementAlign: MatSnackBarHorizontalPosition) {
    this.snackBar.open(text, '', { duration: 2000, verticalPosition: placementFrom, horizontalPosition: placementAlign, panelClass: colorName });
  }
}
