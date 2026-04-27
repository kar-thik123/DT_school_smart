import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { SystemLogFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { SystemLogDeleteComponent } from './dialogs/delete/delete.component';
import { SystemLogService } from './system-log.service';
import { SystemLog } from './system-log.model';
import { rowsAnimation } from '@shared';
import { HttpClient } from '@angular/common/http';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-logs',
  templateUrl: './system-logs.component.html',
  styleUrls: ['./system-logs.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent, CommonModule],
})
export class SystemLogsComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  systemLogService = inject(SystemLogService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'timestamp', label: 'Timestamp', type: 'text', visible: true },
    { def: 'user', label: 'User', type: 'text', visible: true },
    { def: 'activity', label: 'Activity', type: 'text', visible: true },
    { def: 'module', label: 'Module', type: 'text', visible: true },
    { def: 'severity', label: 'Severity', type: 'status', visible: true, statusBadgeMap: { 'Info': 'badge-solid-blue', 'Warning': 'badge-solid-orange', 'Error': 'badge-solid-red', 'Alert': 'badge-solid-purple', 'Critical': 'badge-solid-red' } },
    { def: 'status', label: 'Status', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<SystemLog>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [{ title: 'System Logs', items: ['Settings'], active: 'System Logs' }];

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
    this.systemLogService.getAllLogs().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: SystemLog, filter: string) =>
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

  handleEdit(row: SystemLog) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: SystemLog) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(SystemLogFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { systemLog: data, action },
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

  private updateRecord(updatedRecord: SystemLog) {
    const index = this.dataSource.data.findIndex((record) => record.id === updatedRecord.id);
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: SystemLog) {
    const dialogRef = this.dialog.open(SystemLogDeleteComponent, { data: row });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter((record) => record.id !== row.id);
        this.showNotification('snackbar-danger', 'Delete Record Successfully...!!!', 'bottom', 'center');
      }
    });
  }

  handleBulkDelete(selectedRows: SystemLog[]) {
    const totalSelect = selectedRows.length;
    this.dataSource.data = this.dataSource.data.filter((item) => !selectedRows.includes(item));
    this.showNotification('snackbar-danger', `${totalSelect} Record(s) Deleted Successfully...!!!`, 'bottom', 'center');
  }

  showNotification(colorName: string, text: string, placementFrom: MatSnackBarVerticalPosition, placementAlign: MatSnackBarHorizontalPosition) {
    this.snackBar.open(text, '', { duration: 2000, verticalPosition: placementFrom, horizontalPosition: placementAlign, panelClass: colorName });
  }
}
