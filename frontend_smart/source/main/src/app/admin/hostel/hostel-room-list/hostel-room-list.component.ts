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
import { AllHostelRoomListsDeleteComponent } from './dialogs/delete/delete.component';
import { AllHostelRoomListsFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { HostelRoomList } from './hostel-room-list.model';
import { HostelRoomListService } from './hostel-room-list.service';
import {
  ColumnDefinition,
  MasterTableComponent,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-hostel-room-list',
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
    MasterTableComponent,
  ],
  templateUrl: './hostel-room-list.component.html',
  styleUrl: './hostel-room-list.component.scss',
})
export class HostelRoomListComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  hostelRoomListService = inject(HostelRoomListService);
  private snackBar = inject(MatSnackBar);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'roomId', label: 'Room ID', type: 'text', visible: false },
    { def: 'roomNumber', label: 'Room Number', type: 'text', visible: true },
    { def: 'roomType', label: 'Room Type', type: 'text', visible: true },
    { def: 'floor', label: 'Floor', type: 'text', visible: true },
    { def: 'capacity', label: 'Capacity', type: 'text', visible: true },
    {
      def: 'occupiedStatus',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Vacant: 'badge badge-solid-green',
        Occupied: 'badge badge-solid-orange',
      },
    },
    {
      def: 'currentOccupants',
      label: 'Occupants',
      type: 'text',
      visible: true,
    },
    { def: 'priceFees', label: 'Price', type: 'text', visible: true },
    { def: 'roomCondition', label: 'Condition', type: 'text', visible: true },
    {
      def: 'dateAssigned',
      label: 'Assigned Date',
      type: 'date',
      visible: true,
    },
    { def: 'checkInDate', label: 'Check In', type: 'date', visible: true },
    { def: 'checkOutDate', label: 'Check Out', type: 'date', visible: false },
    { def: 'hostelBlock', label: 'Block', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<HostelRoomList>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    { title: 'Room List', items: ['Hostel'], active: 'Room List' },
  ];

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh() {
    this.loadData();
  }

  addNew() {
    this.openDialog('add');
  }

  editCall(row: HostelRoomList) {
    this.openDialog('edit', row);
  }

  loadData() {
    this.isLoading = true;
    this.hostelRoomListService.getHostelRooms().subscribe(
      (res) => {
        this.dataSource.data = res;
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        console.error('Error loading data:', error);
      }
    );
  }

  openDialog(action: string, row?: HostelRoomList): void {
    const dialogRef = this.dialog.open(AllHostelRoomListsFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { hostelRoomList: row, action },
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

  private updateRecord(updatedRecord: HostelRoomList) {
    const index = this.dataSource.data.findIndex(
      (record) => record.roomId === updatedRecord.roomId
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  deleteItem(row: HostelRoomList) {
    const dialogRef = this.dialog.open(AllHostelRoomListsDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.roomId !== row.roomId
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

  handleBulkDelete(selectedRows: HostelRoomList[]) {
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
