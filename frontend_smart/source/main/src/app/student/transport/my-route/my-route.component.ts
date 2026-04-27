import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { MyRouteService } from './my-route.service';
import { MyRoute } from './my-route.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-my-route',
  templateUrl: './my-route.component.html',
  styleUrls: ['./my-route.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class MyRouteComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  myRouteService = inject(MyRouteService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'routeName', label: 'Route Name', type: 'text', visible: true },
    { def: 'stopName', label: 'Stop Name', type: 'text', visible: true },
    { def: 'pickupTime', label: 'Pickup Time', type: 'text', visible: true },
    { def: 'dropTime', label: 'Drop Time', type: 'text', visible: true },
    { def: 'distance', label: 'Distance', type: 'text', visible: true },
    { def: 'monthlyFees', label: 'Monthly Fees', type: 'number', visible: true },
  ];

  dataSource = new MatTableDataSource<MyRoute>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'My Route',
      items: ['Transport'],
      active: 'My Route',
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
    this.myRouteService.getAllRoutes().subscribe({
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

  detailsCall(row: MyRoute) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Route Details',
        type: 'Transport',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
