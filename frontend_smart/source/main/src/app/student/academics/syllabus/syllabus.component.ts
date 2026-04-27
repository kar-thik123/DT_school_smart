import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  ColumnDefinition,
  MasterTableComponent,
} from '@shared/components/master-table/master-table.component';
import { Syllabus } from './syllabus.model';
import { SyllabusService } from './syllabus.service';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-syllabus',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    BreadcrumbComponent,
    MasterTableComponent,
  ],
  templateUrl: './syllabus.component.html',
  styleUrls: ['./syllabus.component.scss'],
})
export class SyllabusComponent implements OnInit {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'title', label: 'Title', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'class', label: 'Class', type: 'text', visible: true },
    {
      def: 'type',
      label: 'Type',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        PDF: 'badge-danger',
        DOC: 'badge-primary',
        PPT: 'badge-warning',
      },
    },
    { def: 'date', label: 'Date', type: 'date', visible: true },
  ];

  dataSource = new MatTableDataSource<Syllabus>([]);
  isLoading = true;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public syllabusService: SyllabusService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.syllabusService.getAllSyllabus().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      },
    });
  }

  refresh() {
    this.loadData();
  }

  detailsCall(row: Syllabus) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Syllabus',
        type: row.type || 'Syllabus',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
