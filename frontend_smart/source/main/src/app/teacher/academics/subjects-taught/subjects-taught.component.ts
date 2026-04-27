import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

export interface SubjectTaught {
  id: number;
  subjectName: string;
  class: string;
  totalStudents: number;
}

const SUBJECTS_TAUGHT_DATA: SubjectTaught[] = [
  {
    id: 1,
    subjectName: 'Mathematics',
    class: 'Class 1A, Class 1B',
    totalStudents: 60,
  },
  {
    id: 2,
    subjectName: 'Physics',
    class: 'Class 2A, Class 2B',
    totalStudents: 55,
  },
  { id: 3, subjectName: 'Chemistry', class: 'Class 3A', totalStudents: 45 },
  {
    id: 4,
    subjectName: 'Biology',
    class: 'Class 4A, Class 4B',
    totalStudents: 70,
  },
];

@Component({
  selector: 'app-subjects-taught',
  templateUrl: './subjects-taught.component.html',
  styleUrls: ['./subjects-taught.component.scss'],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class SubjectsTaughtComponent {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'subjectName', label: 'Subject Name', type: 'text', visible: true },
    { def: 'class', label: 'Class', type: 'text', visible: true },
    { def: 'totalStudents', label: 'Total Students', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<SubjectTaught>(SUBJECTS_TAUGHT_DATA);
  isLoading = false;

  handleAdd() {
    console.log('Add new subject');
  }

  handleEdit(row: SubjectTaught) {
    console.log('Edit subject', row);
  }

  handleDelete(row: SubjectTaught) {
    this.dataSource.data = this.dataSource.data.filter((item) => item.id !== row.id);
  }

  handleRefresh() {
    this.dataSource.data = [...SUBJECTS_TAUGHT_DATA];
  }

  handleBulkDelete(selectedRows: SubjectTaught[]) {
    this.dataSource.data = this.dataSource.data.filter(
      (item) => !selectedRows.includes(item)
    );
  }
}

