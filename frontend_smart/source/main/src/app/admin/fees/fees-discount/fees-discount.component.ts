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
import { AllFeesDiscountsDeleteComponent } from './dialogs/delete/delete.component';
import { AllFeesDiscountsFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { FeesDiscount } from './fees-discount.model';
import { FeesDiscountService } from './fees-discount.service';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';
import { LocalStorageService } from '@shared/services';

@Component({
  selector: 'app-fees-discount',
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
  templateUrl: './fees-discount.component.html',
  styleUrl: './fees-discount.component.scss',
})
export class FeesDiscountComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  feesDiscountService = inject(FeesDiscountService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'discountId', label: 'Discount ID', type: 'text', visible: false },
    {
      def: 'discountType',
      label: 'Discount Type',
      type: 'text',
      visible: true,
    },
    {
      def: 'discountAmount',
      label: 'Amount',
      type: 'text',
      visible: true,
    },
    {
      def: 'discountPercentage',
      label: 'Percentage',
      type: 'text',
      visible: true,
    },
    {
      def: 'discountCode',
      label: 'Discount Code',
      type: 'text',
      visible: true,
    },
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
    { def: 'startDate', label: 'Start Date', type: 'date', visible: true },
    { def: 'endDate', label: 'End Date', type: 'date', visible: true },
    { def: 'appliedDate', label: 'Applied Date', type: 'date', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<FeesDiscount>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Fees Discount',
      items: ['Fees'],
      active: 'Fees Discount',
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
    this.feesDiscountService.getAllFeesDiscounts().subscribe({
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

  handleEdit(row: FeesDiscount) {
    this.openDialog('edit', row);
  }

  handleRefresh() {
    this.loadData();
  }

  openDialog(action: 'add' | 'edit', data?: FeesDiscount) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AllFeesDiscountsFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { feesDiscount: data, action },
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

  private updateRecord(updatedRecord: FeesDiscount) {
    const index = this.dataSource.data.findIndex(
      (record) => record.discountId === updatedRecord.discountId
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: FeesDiscount) {
    const dialogRef = this.dialog.open(AllFeesDiscountsDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.discountId !== row.discountId
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

  handleBulkDelete(selectedRows: FeesDiscount[]) {
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
