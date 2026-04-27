import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { BackupRestoreFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { BackupRestoreDeleteComponent } from './dialogs/delete/delete.component';
import { BackupRestoreService } from './backup-restore.service';
import { BackupRestore } from './backup-restore.model';
import { rowsAnimation } from '@shared';
import { HttpClient } from '@angular/common/http';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-backup-restore',
  templateUrl: './backup-restore.component.html',
  styleUrls: ['./backup-restore.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent, CommonModule],
})
export class BackupRestoreComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  backupRestoreService = inject(BackupRestoreService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'backupName', label: 'Backup Name', type: 'text', visible: true },
    { def: 'backupDate', label: 'Date', type: 'text', visible: true },
    { def: 'backupSize', label: 'Size', type: 'text', visible: true },
    { def: 'backupType', label: 'Type', type: 'text', visible: true },
    { def: 'triggeredBy', label: 'User', type: 'text', visible: true },
    { def: 'status', label: 'Status', type: 'status', visible: true, statusBadgeMap: { 'Completed': 'badge-solid-green', 'Failed': 'badge-solid-red', 'In Progress': 'badge-solid-orange' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<BackupRestore>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [{ title: 'Backup & Restore', items: ['Settings'], active: 'Backup & Restore' }];

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
    this.backupRestoreService.getAllBackups().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: BackupRestore, filter: string) =>
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

  handleEdit(row: BackupRestore) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: BackupRestore) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(BackupRestoreFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { backupRestore: data, action },
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

  private updateRecord(updatedRecord: BackupRestore) {
    const index = this.dataSource.data.findIndex((record) => record.id === updatedRecord.id);
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: BackupRestore) {
    const dialogRef = this.dialog.open(BackupRestoreDeleteComponent, { data: row });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter((record) => record.id !== row.id);
        this.showNotification('snackbar-danger', 'Delete Record Successfully...!!!', 'bottom', 'center');
      }
    });
  }

  handleBulkDelete(selectedRows: BackupRestore[]) {
    const totalSelect = selectedRows.length;
    this.dataSource.data = this.dataSource.data.filter((item) => !selectedRows.includes(item));
    this.showNotification('snackbar-danger', `${totalSelect} Record(s) Deleted Successfully...!!!`, 'bottom', 'center');
  }

  showNotification(colorName: string, text: string, placementFrom: MatSnackBarVerticalPosition, placementAlign: MatSnackBarHorizontalPosition) {
    this.snackBar.open(text, '', { duration: 2000, verticalPosition: placementFrom, horizontalPosition: placementAlign, panelClass: colorName });
  }
}
