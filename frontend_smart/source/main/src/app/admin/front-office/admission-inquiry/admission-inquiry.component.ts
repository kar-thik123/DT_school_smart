import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { AdmissionInquiryDeleteComponent } from './dialogs/delete/delete.component';
import { AdmissionInquirysFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { AdmissionInquiry } from './admission-inquiry.model';
import { AdmissionInquiryService } from './admission-inquiry.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-admission-inquiry',
  templateUrl: './admission-inquiry.component.html',
  styleUrl: './admission-inquiry.component.scss',
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class AdmissionInquiryComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  admissionInquiryService = inject(AdmissionInquiryService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'inquiryId', label: 'Inquiry ID', type: 'text', visible: false },
    {
      def: 'studentName',
      label: 'Student Name',
      type: 'nameWithImage',
      visible: true,
    },
    {
      def: 'guardianName',
      label: 'Guardian Name',
      type: 'text',
      visible: true,
    },
    {
      def: 'contactNumber',
      label: 'Contact Number',
      type: 'phone',
      visible: true,
    },
    {
      def: 'emailAddress',
      label: 'Email Address',
      type: 'email',
      visible: true,
    },
    {
      def: 'dateOfInquiry',
      label: 'Date of Inquiry',
      type: 'date',
      visible: true,
    },
    {
      def: 'programOfInterest',
      label: 'Program of Interest',
      type: 'text',
      visible: false,
    },
    {
      def: 'preferredStartDate',
      label: 'Preferred Start Date',
      type: 'date',
      visible: false,
    },
    {
      def: 'inquirySource',
      label: 'Inquiry Source',
      type: 'text',
      visible: true,
    },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        New: 'badge badge-solid-green',
        'In Process': 'badge badge-solid-purple',
        Closed: 'badge badge-solid-orange',
      },
    },
    { def: 'notes', label: 'Notes', type: 'text', visible: false },
    {
      def: 'followUpDate',
      label: 'Follow Up Date',
      type: 'date',
      visible: true,
    },
    { def: 'assignedTo', label: 'Assigned To', type: 'text', visible: true },
    {
      def: 'campusLocation',
      label: 'Campus Location',
      type: 'text',
      visible: true,
    },
    {
      def: 'previousEducation',
      label: 'Previous Education',
      type: 'text',
      visible: true,
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<AdmissionInquiry>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Admission Inquiry',
      items: ['Front'],
      active: 'Admission Inquiry',
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
    this.isLoading = true;
    this.admissionInquiryService.getAdmissionInquiries().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (
          data: AdmissionInquiry,
          filter: string
        ) =>
          Object.values(data).some((value) =>
            value.toString().toLowerCase().includes(filter)
          );
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  handleAdd() {
    this.openDialog('add');
  }

  handleEdit(row: AdmissionInquiry) {
    this.openDialog('edit', row);
  }

  handleRefresh() {
    this.loadData();
  }

  handleDelete(row: AdmissionInquiry) {
    const dialogRef = this.dialog.open(AdmissionInquiryDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.inquiryId !== row.inquiryId
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

  handleBulkDelete(selectedRows: AdmissionInquiry[]) {
    this.dataSource.data = this.dataSource.data.filter(
      (item) => !selectedRows.includes(item)
    );
    this.showNotification(
      'snackbar-danger',
      `${selectedRows.length} Record(s) Deleted Successfully...!!!`,
      'bottom',
      'center'
    );
  }

  openDialog(action: 'add' | 'edit', data?: AdmissionInquiry) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(AdmissionInquirysFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { admissionInquiry: data, action },
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

  private updateRecord(updatedRecord: AdmissionInquiry) {
    const index = this.dataSource.data.findIndex(
      (record) => record.inquiryId === updatedRecord.inquiryId
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
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
