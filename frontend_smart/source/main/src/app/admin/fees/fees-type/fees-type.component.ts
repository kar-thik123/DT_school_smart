import { Direction } from '@angular/cdk/bidi';

import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSnackBar,
  MatSnackBarVerticalPosition,
  MatSnackBarHorizontalPosition,
} from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { Subject } from 'rxjs';
import { AllFeesTypesDeleteComponent } from './dialogs/delete/delete.component';
import { AllFeesTypesFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { FeesType } from './fees-type.model';
import { FeesTypeService } from './fees-type.service';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';
import { LocalStorageService } from '@shared/services';

@Component({
  selector: 'app-fees-type',
  animations: [rowsAnimation],
  imports: [
    BreadcrumbComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatOptionModule,
    MatCheckboxModule,
    MatTableModule,
    MatSortModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatPaginatorModule,
    MasterTableComponent
],
  templateUrl: './fees-type.component.html',
  styleUrl: './fees-type.component.scss',
})
export class FeesTypeComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  feesTypeService = inject(FeesTypeService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'feeTypeId', label: 'Fee Type ID', type: 'text', visible: false },
    { def: 'feeTypeName', label: 'Fee Type Name', type: 'text', visible: true },
    { def: 'category', label: 'Category', type: 'text', visible: true },
    { def: 'description', label: 'Description', type: 'text', visible: true },
    { def: 'amount', label: 'Amount', type: 'text', visible: true },
    {
      def: 'applicableClasses',
      label: 'Applicable Classes',
      type: 'text',
      visible: true,
    },
    { def: 'frequency', label: 'Frequency', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Active: 'badge-solid-green',
        Inactive: 'badge-solid-orange',
      },
    },
    { def: 'createdBy', label: 'Created By', type: 'text', visible: true },
    { def: 'createdDate', label: 'Created Date', type: 'date', visible: true },
    { def: 'lastUpdated', label: 'Last Updated', type: 'date', visible: false },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<FeesType>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Fees Type',
      items: ['Fees'],
      active: 'Fees Type',
    },
  ];

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.feesTypeService.getAllFeesTypes().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => console.error(err),
    });
  }

  handleAdd() {
    this.openDialog('add');
  }

  handleEdit(row: FeesType) {
    this.openDialog('edit', row);
  }

  handleRefresh() {
    this.loadData();
  }

  openDialog(action: 'add' | 'edit', data?: FeesType) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AllFeesTypesFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { feesType: data, action },
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

  private updateRecord(updatedRecord: FeesType) {
    const index = this.dataSource.data.findIndex(
      (record) => record.feeTypeId === updatedRecord.feeTypeId
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: FeesType) {
    const dialogRef = this.dialog.open(AllFeesTypesDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.feeTypeId !== row.feeTypeId
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

  handleBulkDelete(selectedRows: FeesType[]) {
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
