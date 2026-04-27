import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { VehicleDetailsService } from './vehicle-details.service';
import { VehicleDetail } from './vehicle-details.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-vehicle-details',
  templateUrl: './vehicle-details.component.html',
  styleUrls: ['./vehicle-details.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class VehicleDetailsComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  vehicleDetailsService = inject(VehicleDetailsService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'vehicleNo', label: 'Vehicle No', type: 'text', visible: true },
    { def: 'vehicleModel', label: 'Vehicle Model', type: 'text', visible: true },
    { def: 'driverName', label: 'Driver Name', type: 'text', visible: true },
    { def: 'driverContact', label: 'Driver Contact', type: 'text', visible: true },
    { def: 'vehicleType', label: 'Vehicle Type', type: 'text', visible: true },
    { def: 'capacity', label: 'Capacity', type: 'number', visible: true },
  ];

  dataSource = new MatTableDataSource<VehicleDetail>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Vehicle Details',
      items: ['Transport'],
      active: 'Vehicle Details',
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
    this.vehicleDetailsService.getAllVehicles().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  detailsCall(row: VehicleDetail) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Vehicle Details',
        type: row.vehicleType || 'Transport',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
