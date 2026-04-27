import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';

import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { AssignmentService } from './assignment.service';
import { Assignment } from './assignment.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';

import { AssignmentFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { AssignmentDeleteComponent } from './dialogs/delete/delete.component';

@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class AssignmentsComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  assignmentService = inject(AssignmentService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);


  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'title', label: 'Title', type: 'text', visible: true },
    { def: 'class', label: 'Class', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'assignedDate', label: 'Assigned Date', type: 'text', visible: true },
    { def: 'dueDate', label: 'Due Date', type: 'text', visible: true },
    { def: 'submissions', label: 'Submissions', type: 'text', visible: true },
    { 
      def: 'status', 
      label: 'Status', 
      type: 'status', 
      visible: true,
      statusBadgeMap: {
        'Active': 'badge-solid-green',
        'Closed': 'badge-solid-red'
      }
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Assignment>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Assignments',
      items: ['Teacher', 'Academics'],
      active: 'Assignments',
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
    this.assignmentService.getAllAssignments().subscribe({
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

  handleEdit(row: Assignment) {
    this.openDialog('edit', row);
  }

  openDialog(action: 'add' | 'edit', data?: Assignment) {
    let direction: Direction;
    if (this.localStorageService.get('isRtl') === 'true') {
      direction = 'rtl';
    } else {
      direction = 'ltr';
    }
    const dialogRef = this.dialog.open(AssignmentFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: {
        assignment: data,
        action: action,
      },
      direction: direction,
    });
    dialogRef.afterClosed().subscribe((result: Assignment) => {
      if (result) {
        if (action === 'add') {
          this.dataSource.data = [result, ...this.dataSource.data];
          this.showNotification('snackbar-success', 'Add Record Successfully...!!!', 'bottom', 'center');
        } else {
          this.updateRecord(result);
          this.showNotification('black', 'Edit Record Successfully...!!!', 'bottom', 'center');
        }
      }
    });
  }

  private updateRecord(item: Assignment) {
    const index = this.dataSource.data.findIndex((it) => it.id === item.id);
    if (index !== -1) {
      const newData = [...this.dataSource.data];
      newData[index] = item;
      this.dataSource.data = newData;
    }
  }

  handleDelete(row: Assignment) {
    let direction: Direction;
    if (this.localStorageService.get('isRtl') === 'true') {
      direction = 'rtl';
    } else {
      direction = 'ltr';
    }
    const dialogRef = this.dialog.open(AssignmentDeleteComponent, {
      data: row,
      direction: direction,
    });
    dialogRef.afterClosed().subscribe((result: number) => {
      if (result) {
        this.dataSource.data = this.dataSource.data.filter((it) => it.id !== result);
        this.showNotification('snackbar-danger', 'Delete Record Successfully...!!!', 'bottom', 'center');
      }
    });
  }

  handleBulkDelete(selectedRows: Assignment[]) {
    const totalSelect = selectedRows.length;
    const ids = selectedRows.map((row) => row.id);
    ids.forEach((id) => {
      this.assignmentService.deleteAssignment(id).subscribe();
    });
    this.dataSource.data = this.dataSource.data.filter((it) => !ids.includes(it.id));
    this.showNotification('snackbar-danger', `${totalSelect} Record(s) Deleted Successfully...!!!`, 'bottom', 'center');
  }


  showNotification(colorName: string, text: string, placementFrom: MatSnackBarVerticalPosition, placementAlign: MatSnackBarHorizontalPosition) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
}

