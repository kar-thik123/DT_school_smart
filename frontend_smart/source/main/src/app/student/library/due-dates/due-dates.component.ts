import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { DueDatesService } from './due-dates.service';
import { DueDate } from './due-dates.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-due-dates',
  templateUrl: './due-dates.component.html',
  styleUrls: ['./due-dates.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class DueDatesComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  dueDatesService = inject(DueDatesService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'bookTitle', label: 'Book Title', type: 'text', visible: true },
    { def: 'isbnNo', label: 'ISBN No', type: 'text', visible: true },
    { def: 'dueDate', label: 'Due Date', type: 'date', visible: true },
    { def: 'daysRemaining', label: 'Days Remaining', type: 'number', visible: true },
    { def: 'fineAmount', label: 'Fine Amount', type: 'number', visible: true },
    { def: 'status', label: 'Status', type: 'status', visible: true, statusBadgeMap: { 'Active': 'badge-solid-blue', 'Overdue': 'badge-solid-red', 'Due Today': 'badge-solid-orange' } },
  ];

  dataSource = new MatTableDataSource<DueDate>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Due Dates',
      items: ['Library'],
      active: 'Due Dates',
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
    this.dueDatesService.getAllDueDates().subscribe({
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

  detailsCall(row: DueDate) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Library Due Date',
        type: row.status || 'Library',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
