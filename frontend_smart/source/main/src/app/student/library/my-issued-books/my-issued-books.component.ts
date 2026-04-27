import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { MyIssuedBooksService } from './my-issued-books.service';
import { MyIssuedBook } from './my-issued-books.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-my-issued-books',
  templateUrl: './my-issued-books.component.html',
  styleUrls: ['./my-issued-books.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class MyIssuedBooksComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  issuedBooksService = inject(MyIssuedBooksService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'bookTitle', label: 'Book Title', type: 'text', visible: true },
    { def: 'author', label: 'Author', type: 'text', visible: true },
    { def: 'isbnNo', label: 'ISBN No', type: 'text', visible: true },
    { def: 'issueDate', label: 'Issue Date', type: 'date', visible: true },
    { def: 'dueDate', label: 'Due Date', type: 'date', visible: true },
    { def: 'returnDate', label: 'Return Date', type: 'date', visible: true },
    { def: 'status', label: 'Status', type: 'status', visible: true, statusBadgeMap: { 'Issued': 'badge-solid-blue', 'Returned': 'badge-solid-green', 'Overdue': 'badge-solid-red' } },
  ];

  dataSource = new MatTableDataSource<MyIssuedBook>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'My Issued Books',
      items: ['Library'],
      active: 'My Issued Books',
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
    this.issuedBooksService.getAllIssuedBooks().subscribe({
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

  detailsCall(row: MyIssuedBook) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Issued Book',
        type: row.status || 'Book',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
