import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { TransportFeeService } from './transport-fees.service';
import { TransportFee } from './transport-fees.model';
import { rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';
import { FeesFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { FeesDeleteComponent } from './dialogs/delete/delete.component';

@Component({
  selector: 'app-transport-fees',
  templateUrl: './transport-fees.component.html',
  styleUrls: ['./transport-fees.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class TransportFeesComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  feeService = inject(TransportFeeService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    {
      def: 'student_name',
      label: 'Student Name',
      type: 'nameWithImage',
      visible: true,
    },
    { def: 'student_id', label: 'Student ID', type: 'text', visible: true },
    { def: 'class_section', label: 'Class', type: 'text', visible: true },
    { def: 'route_name', label: 'Route', type: 'text', visible: true },
    { def: 'amount', label: 'Amount', type: 'text', visible: true },
    { def: 'payment_date', label: 'Date', type: 'date', visible: true },
    { def: 'payment_method', label: 'Method', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Paid: 'badge badge-solid-green',
        Unpaid: 'badge badge-solid-orange',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<TransportFee>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Transport Fees',
      items: ['Transport'],
      active: 'Fees',
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
    this.feeService
      .getFees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.isLoading = false;
          this.setupFilter();
        },
        error: (error) => {
          console.error(error);
          this.isLoading = false;
        },
      });
  }

  setupFilter() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const dataStr = Object.keys(data)
        .reduce((currentTerm: string, key: string) => {
          return currentTerm + (data as { [key: string]: any })[key] + ' ';
        }, '')
        .toLowerCase();
      return dataStr.indexOf(filter) !== -1;
    };
  }

  handleAdd() {
    this.openDialog('add');
  }

  handleEdit(row: TransportFee) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: TransportFee) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(FeesFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: {
        fee: data ? data : new TransportFee({} as TransportFee),
        action: action,
      },
      direction: varDirection,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 1) {
        this.loadData();
        this.showNotification(
          action === 'add' ? 'snackbar-success' : 'black',
          `${action === 'add' ? 'Add' : 'Edit'} Record Successfully...!!!`,
          'bottom',
          'center'
        );
      }
    });
  }

  handleDelete(row: TransportFee) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(FeesDeleteComponent, {
      data: row,
      direction: varDirection,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 1) {
        this.loadData();
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
}
