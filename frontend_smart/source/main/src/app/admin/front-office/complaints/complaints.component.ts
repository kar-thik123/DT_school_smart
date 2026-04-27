import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { TableExportUtil, rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { formatDate } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { Complaints } from '../complaints/complaints.model';
import { ComplaintsService } from '../complaints/complaints.service';
import { ComplaintsDeleteComponent } from './dialogs/delete/delete.component';
import { ComplaintsFormComponent } from './dialogs/form-dialog/form-dialog.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-complaints',
  templateUrl: './complaints.component.html',
  styleUrls: ['./complaints.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class ComplaintsComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  complaintsService = inject(ComplaintsService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'complaintId', label: 'Com. ID', type: 'text', visible: true },
    {
      def: 'complainantName',
      label: 'Complainant Name',
      type: 'nameWithImage',
      visible: true,
    },
    {
      def: 'complainantType',
      label: 'Complainant Type',
      type: 'text',
      visible: true,
    },
    {
      def: 'complaintDate',
      label: 'Complaint Date',
      type: 'date',
      visible: true,
    },
    {
      def: 'complaintTime',
      label: 'Complaint Time',
      type: 'time',
      visible: true,
    },

    { def: 'studentName', label: 'Student Name', type: 'text', visible: false },
    {
      def: 'complaintDescription',
      label: 'Complaint Description',
      type: 'text',
      visible: true,
    },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Resolved: 'badge-solid-green',
        Open: 'badge-solid-purple',
        'In Progress': 'badge-solid-blue',
        Closed: 'badge-solid-brown',
      },
    },
    { def: 'department', label: 'Department', type: 'text', visible: true },
    { def: 'assignedTo', label: 'Assigned To', type: 'text', visible: true },
    {
      def: 'resolutionDescription',
      label: 'Resolution Description',
      type: 'text',
      visible: false,
    },
    {
      def: 'resolutionDate',
      label: 'Resolution Date',
      type: 'date',
      visible: true,
    },
    {
      def: 'priorityLevel',
      label: 'Priority Level',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Low: 'badge-solid-green',
        Medium: 'badge-solid-purple',
        High: 'badge-solid-orange',
      },
    },
    { def: 'feedback', label: 'Feedback', type: 'text', visible: false },
    { def: 'createdAt', label: 'Created At', type: 'date', visible: false },
    { def: 'updatedAt', label: 'Updated At', type: 'date', visible: false },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Complaints>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();
  breadscrums = [
    {
      title: 'Complaints',
      items: ['Front'],
      active: 'Complaints',
    },
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

  loadData() {
    this.complaintsService.getComplaints().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => console.error(err),
    });
  }

  addNew() {
    this.openDialog('add');
  }

  editCall(row: Complaints) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: Complaints) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(ComplaintsFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { complaints: data, action },
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

  private updateRecord(updatedRecord: Complaints) {
    const index = this.dataSource.data.findIndex(
      (record) => record.complaintId === updatedRecord.complaintId
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  deleteItem(row: Complaints) {
    const dialogRef = this.dialog.open(ComplaintsDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.complaintId !== row.complaintId
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

  exportExcel() {
    const exportData = this.dataSource.filteredData.map((complaint) => ({
      'Complaint ID': complaint.complaintId,
      'Complaint Date': complaint.complaintDate
        ? formatDate(complaint.complaintDate, 'yyyy-MM-dd', 'en')
        : 'N/A',
      'Complaint Time': complaint.complaintTime || 'N/A',
      'Complainant Name': complaint.complainantName,
      'Complainant Type': complaint.complainantType,
      'Student Name': complaint.studentName || 'N/A',
      'Complaint Description': complaint.complaintDescription,
      Department: complaint.department,
      Status: complaint.status,
      'Assigned To': complaint.assignedTo,
      'Resolution Description': complaint.resolutionDescription || 'N/A',
      'Resolution Date': complaint.resolutionDate
        ? formatDate(complaint.resolutionDate, 'yyyy-MM-dd', 'en')
        : 'N/A',
      'Priority Level': complaint.priorityLevel,
      Feedback: complaint.feedback || 'N/A',
      'Created At': complaint.createdAt
        ? formatDate(complaint.createdAt, 'yyyy-MM-dd HH:mm:ss', 'en')
        : 'N/A',
      'Updated At': complaint.updatedAt
        ? formatDate(complaint.updatedAt, 'yyyy-MM-dd HH:mm:ss', 'en')
        : 'N/A',
    }));

    TableExportUtil.exportToExcel(exportData, 'complaints_export');
  }

  removeSelectedRows(selectedRows: Complaints[]) {
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
}
