import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { StudentAllocationService } from './student-allocation.service';
import { StudentAllocation } from './student-allocation.model';
import { rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';
import { AllocationFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { AllocationDeleteComponent } from './dialogs/delete/delete.component';

@Component({
  selector: 'app-student-allocation',
  templateUrl: './student-allocation.component.html',
  styleUrls: ['./student-allocation.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class StudentAllocationComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  allocationService = inject(StudentAllocationService);
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
    { def: 'vehicle_no', label: 'Vehicle', type: 'text', visible: true },
    { def: 'stop_point', label: 'Stop', type: 'text', visible: true },
    { def: 'allocation_date', label: 'Date', type: 'date', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Active: 'badge badge-solid-green',
        Inactive: 'badge badge-solid-orange',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<StudentAllocation>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Student Allocation',
      items: ['Transport'],
      active: 'Allocation',
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
    this.allocationService
      .getAllocations()
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

  handleEdit(row: StudentAllocation) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: StudentAllocation) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AllocationFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: {
        allocation: data
          ? data
          : new StudentAllocation({} as StudentAllocation),
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

  handleDelete(row: StudentAllocation) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AllocationDeleteComponent, {
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
