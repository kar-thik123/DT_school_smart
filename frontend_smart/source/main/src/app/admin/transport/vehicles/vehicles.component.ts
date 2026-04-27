import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { VehicleService } from './vehicles.service';
import { Vehicle } from './vehicles.model';
import { rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';
import { VehiclesFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { VehiclesDeleteComponent } from './dialogs/delete/delete.component';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class VehiclesComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  vehicleService = inject(VehicleService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'vehicle_no', label: 'Vehicle No', type: 'text', visible: true },
    { def: 'vehicle_model', label: 'Model', type: 'text', visible: true },
    { def: 'year_made', label: 'Year', type: 'text', visible: true },
    {
      def: 'driver_name',
      label: 'Driver Name',
      type: 'nameWithImage',
      visible: true,
    },
    { def: 'driver_license', label: 'License', type: 'text', visible: true },
    { def: 'vehicle_type', label: 'Type', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Active: 'badge badge-solid-green',
        Inactive: 'badge badge-solid-orange',
        'Under Maintenance': 'badge badge-solid-purple',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Vehicle>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Vehicles',
      items: ['Transport'],
      active: 'Vehicles',
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
    this.vehicleService
      .getVehicles()
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

  handleEdit(row: Vehicle) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: Vehicle) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(VehiclesFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: {
        vehicle: data ? data : new Vehicle({} as Vehicle),
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

  handleDelete(row: Vehicle) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(VehiclesDeleteComponent, {
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
