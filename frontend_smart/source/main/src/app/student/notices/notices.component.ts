import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { NoticesService } from './notices.service';
import { Notice } from './notices.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-notices',
  templateUrl: './notices.component.html',
  styleUrls: ['./notices.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class NoticesComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  noticeService = inject(NoticesService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'title', label: 'Title', type: 'text', visible: true },
    { def: 'date', label: 'Date', type: 'date', visible: true },
    {
      def: 'category',
      label: 'Category',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Academic: 'badge-solid-blue',
        Sports: 'badge-solid-green',
        Holiday: 'badge-solid-red',
        Event: 'badge-solid-purple',
        Meeting: 'badge-solid-orange',
        Library: 'badge-solid-cyan',
        Finance: 'badge-solid-brown',
        Competition: 'badge-solid-blue',
        Health: 'badge-solid-green',
        Activity: 'badge-solid-orange',
      },
    },
    { def: 'postedBy', label: 'Posted By', type: 'text', visible: true },
  ];

  dataSource = new MatTableDataSource<Notice>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Notices',
      items: ['Communication'],
      active: 'Notices',
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
    this.noticeService.getAllNotices().subscribe({
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

  detailsCall(row: Notice) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Notice Details',
        type: row.category || 'Notice',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
