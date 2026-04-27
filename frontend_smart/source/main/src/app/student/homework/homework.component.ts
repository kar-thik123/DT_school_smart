import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { HomeworkFormComponent } from './form-dialog/form-dialog.component';
import { HomeworkService } from './homework.service';
import { Homework } from './homework.model';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { HttpClient } from '@angular/common/http';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-homework',
  templateUrl: './homework.component.html',
  styleUrls: ['./homework.component.scss'],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class HomeworkComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  homeworkService = inject(HomeworkService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: false },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'class', label: 'Class', type: 'text', visible: true },
    { def: 'section', label: 'Section', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    {
      def: 'homeworkTitle',
      label: 'Homework Title',
      type: 'text',
      visible: true,
    },
    { def: 'assignedBy', label: 'Assigned By', type: 'text', visible: true },
    {
      def: 'homeworkDate',
      label: 'Homework Date',
      type: 'date',
      visible: true,
    },
    {
      def: 'submissionDate',
      label: 'Submission Date',
      type: 'date',
      visible: true,
    },
    {
      def: 'evaluationDate',
      label: 'Evaluation Date',
      type: 'date',
      visible: true,
    },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Complete: 'badge badge-solid-green',
        Incomplete: 'badge badge-solid-orange',
      },
    },
    { def: 'attachments', label: 'Attachments', type: 'file', visible: true },
    { def: 'grade', label: 'Grade', type: 'text', visible: true },
    { def: 'feedback', label: 'Feedback', type: 'text', visible: true },
    {
      def: 'lateSubmission',
      label: 'Late Submission',
      type: 'text', // boolean in model but rendered as Yes/No usually? let's stick to text or custom. Model says boolean. MasterTable doesn't support boolean explicitly, will just show "true"/"false".
      visible: false,
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Homework>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Homework',
      items: ['Student'],
      active: 'Homework',
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
    this.homeworkService.getAllHomework().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: Homework, filter: string) =>
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

  detailsCall(row: Homework) {
    this.openDialog('details', row);
  }

  openDialog(action: 'details', data?: Homework) {
    const varDirection: Direction =
      this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(HomeworkFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { homework: data, action },
      direction: varDirection,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Form might save data, so refresh
      if (result) {
        this.loadData();
      }
    });
  }
}
