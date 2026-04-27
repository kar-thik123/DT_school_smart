import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { RoomDetailsService } from './room-details.service';
import { RoomDetail } from './room-details.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-room-details',
  templateUrl: './room-details.component.html',
  styleUrls: ['./room-details.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class RoomDetailsComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  roomDetailsService = inject(RoomDetailsService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'roomNo', label: 'Room No', type: 'text', visible: true },
    { def: 'roomType', label: 'Room Type', type: 'text', visible: true },
    { def: 'hostelName', label: 'Hostel Name', type: 'text', visible: true },
    { def: 'noOfBeds', label: 'No of Beds', type: 'number', visible: true },
    {
      def: 'availability',
      label: 'Availability',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Available: 'badge-solid-green',
        Full: 'badge-solid-red',
        Reserved: 'badge-solid-orange',
      },
    },
    { def: 'rent', label: 'Rent', type: 'number', visible: true },
  ];

  dataSource = new MatTableDataSource<RoomDetail>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Room Details',
      items: ['Hostel'],
      active: 'Room Details',
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
    this.roomDetailsService.getAllRooms().subscribe({
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

  detailsCall(row: RoomDetail) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Room Details',
        type: row.roomType || 'Hostel',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
