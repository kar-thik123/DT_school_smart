import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { CourseCurriculumFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { CourseCurriculumDeleteComponent } from './dialogs/delete/delete.component';
import { CourseCurriculumService } from './course-curriculum.service';
import { CourseCurriculum } from './course-curriculum.model';
import { rowsAnimation } from '@shared';

import { HttpClient } from '@angular/common/http';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

@Component({
  selector: 'app-all-course-curriculum',
  templateUrl: './all-course-curriculum.component.html',
  styleUrls: ['./all-course-curriculum.component.scss'],
  standalone: true,
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class AllCourseCurriculumComponent implements OnInit, OnDestroy {
  httpClient = inject(HttpClient);
  dialog = inject(MatDialog);
  courseCurriculumService = inject(CourseCurriculumService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    {
      def: 'courseName',
      label: 'Course Name',
      type: 'text',
      visible: true,
    },
    {
      def: 'className',
      label: 'Class',
      type: 'text',
      visible: true,
    },
    {
      def: 'subjectName',
      label: 'Subject',
      type: 'text',
      visible: true,
    },
    {
        def: 'description',
        label: 'Description',
        type: 'text',
        visible: true,
    },

    {
      def: 'duration',
      label: 'Duration',
      type: 'text',
      visible: true,
    },
    {
      def: 'referenceMaterial',
      label: 'Reference Material',
      type: 'text',
      visible: true,
    },
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

  dataSource = new MatTableDataSource<CourseCurriculum>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Course Curriculum',
      items: ['Academics'],
      active: 'Course Curriculum',
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
    this.courseCurriculumService.getAllCurriculums().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.dataSource.filterPredicate = (data: CourseCurriculum, filter: string) =>
          Object.values(data).some((value) =>
            value ? value.toString().toLowerCase().includes(filter.toLowerCase()) : false
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

  handleEdit(row: CourseCurriculum) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: CourseCurriculum) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(CourseCurriculumFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { courseCurriculum: data, action },
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

  private updateRecord(updatedRecord: CourseCurriculum) {
    const index = this.dataSource.data.findIndex(
      (record) => record.id === updatedRecord.id
    );
    if (index !== -1) {
      this.dataSource.data[index] = updatedRecord;
      this.dataSource._updateChangeSubscription();
    }
  }

  handleDelete(row: CourseCurriculum) {
    const dialogRef = this.dialog.open(CourseCurriculumDeleteComponent, {
      data: row,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (record) => record.id !== row.id
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

  handleBulkDelete(selectedRows: CourseCurriculum[]) {
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
