import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { AcademicRuleFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { AcademicRuleDeleteComponent } from './dialogs/delete/delete.component';
import { AcademicRuleService } from './academic-rule.service';
import { AcademicRule } from './academic-rule.model';
import { rowsAnimation } from '@shared';
import { HttpClient } from '@angular/common/http';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-academic-rules',
  templateUrl: './academic-rules.component.html',
  styleUrls: ['./academic-rules.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent, CommonModule],
})
export class AcademicRulesComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  academicRuleService = inject(AcademicRuleService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'ruleName', label: 'Rule Name', type: 'text', visible: true },
    { def: 'category', label: 'Category', type: 'text', visible: true },
    { def: 'appliedTo', label: 'Applied To', type: 'text', visible: true },
    { def: 'priority', label: 'Priority', type: 'text', visible: true },
    { def: 'effectiveDate', label: 'Effective Date', type: 'date', visible: true },
    { def: 'status', label: 'Status', type: 'status', visible: true, statusBadgeMap: { 'Active': 'badge-solid-green', 'Draft': 'badge-solid-orange' } },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<AcademicRule>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [{ title: 'Academic Rules', items: ['Settings'], active: 'Academic Rules' }];

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
    this.academicRuleService.getAllRules().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: AcademicRule, filter: string) =>
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

  handleEdit(row: AcademicRule) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: AcademicRule) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AcademicRuleFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { academicRule: data, action },
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

  private updateRecord(updatedRecord: AcademicRule) {
    const index = this.dataSource.data.findIndex((record) => record.id === updatedRecord.id);
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: AcademicRule) {
    const dialogRef = this.dialog.open(AcademicRuleDeleteComponent, { data: row });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter((record) => record.id !== row.id);
        this.showNotification('snackbar-danger', 'Delete Record Successfully...!!!', 'bottom', 'center');
      }
    });
  }

  handleBulkDelete(selectedRows: AcademicRule[]) {
    const totalSelect = selectedRows.length;
    this.dataSource.data = this.dataSource.data.filter((item) => !selectedRows.includes(item));
    this.showNotification('snackbar-danger', `${totalSelect} Record(s) Deleted Successfully...!!!`, 'bottom', 'center');
  }

  showNotification(colorName: string, text: string, placementFrom: MatSnackBarVerticalPosition, placementAlign: MatSnackBarHorizontalPosition) {
    this.snackBar.open(text, '', { duration: 2000, verticalPosition: placementFrom, horizontalPosition: placementAlign, panelClass: colorName });
  }
}
