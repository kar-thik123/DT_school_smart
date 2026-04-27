import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';

import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { LessonPlanService } from './lesson-plan.service';
import { LessonPlan } from './lesson-plan.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

import { LessonPlanFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { LessonPlanDeleteComponent } from './dialogs/delete/delete.component';

@Component({
  selector: 'app-lesson-plans',
  templateUrl: './lesson-plans.component.html',
  styleUrls: ['./lesson-plans.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class LessonPlansComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  lessonService = inject(LessonPlanService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'date', label: 'Date', type: 'text', visible: true },
    { def: 'class', label: 'Class', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'topic', label: 'Topic', type: 'text', visible: true },
    {
      def: 'status',
      label: 'Status',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Planned: 'badge-solid-blue',
        'In Progress': 'badge-solid-orange',
        Completed: 'badge-solid-green',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<LessonPlan>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Lesson Plans',
      items: ['Teacher', 'Academics'],
      active: 'Plans',
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
    this.lessonService.getAllLessonPlans().subscribe({
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

  handleAdd() {
    this.openDialog('add');
  }

  handleEdit(row: LessonPlan) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: LessonPlan) {
    let direction: Direction;
    if (this.localStorageService.get('isRtl') === 'true') {
      direction = 'rtl';
    } else {
      direction = 'ltr';
    }
    const dialogRef = this.dialog.open(LessonPlanFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: {
        lessonPlan: data,
        action: action,
      },
      direction: direction,
    });
    dialogRef.afterClosed().subscribe((result: LessonPlan) => {
      if (result) {
        if (action === 'add') {
          this.dataSource.data = [result, ...this.dataSource.data];
          this.showNotification(
            'snackbar-success',
            'Add Record Successfully...!!!',
            'bottom',
            'center'
          );
        } else {
          this.updateRecord(result);
          this.showNotification(
            'black',
            'Edit Record Successfully...!!!',
            'bottom',
            'center'
          );
        }
      }
    });
  }

  private updateRecord(item: LessonPlan) {
    const index = this.dataSource.data.findIndex((it) => it.id === item.id);
    if (index !== -1) {
      const newData = [...this.dataSource.data];
      newData[index] = item;
      this.dataSource.data = newData;
    }
  }

  handleDelete(row: LessonPlan) {
    let direction: Direction;
    if (this.localStorageService.get('isRtl') === 'true') {
      direction = 'rtl';
    } else {
      direction = 'ltr';
    }
    const dialogRef = this.dialog.open(LessonPlanDeleteComponent, {
      data: row,
      direction: direction,
    });
    dialogRef.afterClosed().subscribe((result: number) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter(
          (it) => it.id !== result
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

  handleBulkDelete(selectedRows: LessonPlan[]) {
    const totalSelect = selectedRows.length;
    const ids = selectedRows.map((row) => row.id);
    ids.forEach((id) => {
      this.lessonService.deleteLessonPlan(id).subscribe();
    });
    this.dataSource.data = this.dataSource.data.filter(
      (it) => !ids.includes(it.id)
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
