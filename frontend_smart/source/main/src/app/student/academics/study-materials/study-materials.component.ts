import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { StudyMaterialsService } from './study-materials.service';
import { StudyMaterial } from './study-materials.model';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { DetailsWindowComponent } from '@shared/components/details-window/details-window.component';

@Component({
  selector: 'app-study-materials',
  templateUrl: './study-materials.component.html',
  styleUrls: ['./study-materials.component.scss'],
  animations: [rowsAnimation],
  imports: [BreadcrumbComponent, MasterTableComponent],
  standalone: true
})
export class StudyMaterialsComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  materialService = inject(StudyMaterialsService);

  columnDefinitions: ColumnDefinition[] = [
    { def: 'id', label: 'ID', type: 'text', visible: false },
    { def: 'title', label: 'Title', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'type', label: 'Type', type: 'status', visible: true, statusBadgeMap: { 'PDF': 'badge-danger', 'Video': 'badge-info', 'Image': 'badge-success', 'DOC': 'badge-primary', 'PPT': 'badge-warning' } },
    { def: 'date', label: 'Date', type: 'date', visible: true },
  ];

  dataSource = new MatTableDataSource<StudyMaterial>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Study Materials',
      items: ['Academics'],
      active: 'Materials',
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
    this.materialService.getAllStudyMaterials().subscribe({
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

  detailsCall(row: StudyMaterial) {
    this.dialog.open(DetailsWindowComponent, {
      width: '600px',
      data: {
        title: 'Study Material',
        type: row.type || 'Material',
        item: row,
        columns: this.columnDefinitions
      },
    });
  }
}
