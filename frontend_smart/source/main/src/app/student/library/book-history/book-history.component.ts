import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { BookHistoryService } from './book-history.service';
import { BookHistory } from './book-history.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-book-history',
  templateUrl: './book-history.component.html',
  styleUrls: ['./book-history.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class BookHistoryComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  bookHistoryService = inject(BookHistoryService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'bookTitle', label: 'Book Title', type: 'text', visible: true },
    { def: 'author', label: 'Author', type: 'text', visible: true },
    { def: 'isbnNo', label: 'ISBN No', type: 'text', visible: true },
    { def: 'issueDate', label: 'Issue Date', type: 'date', visible: true },
    { def: 'returnDate', label: 'Return Date', type: 'date', visible: true },
    { def: 'category', label: 'Category', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<BookHistory>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Book History',
      items: ['Library'],
      active: 'Book History',
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
    this.bookHistoryService.getAllBookHistory().subscribe({
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

  detailsCall(row: BookHistory) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Book History',
        type: row.category || 'Book',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
