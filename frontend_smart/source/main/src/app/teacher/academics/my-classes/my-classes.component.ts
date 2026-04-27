import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import {
  MasterTableComponent,
  ColumnDefinition,
} from '@shared/components/master-table/master-table.component';

export interface MyClass {
  id: number;
  className: string;
  subject: string;
  time: string;
  roomNo: string;
}

const MY_CLASSES_DATA: MyClass[] = [
  {
    id: 1,
    className: 'Class 1A',
    subject: 'Mathematics',
    time: '9:00 AM - 10:00 AM',
    roomNo: '101',
  },
  {
    id: 2,
    className: 'Class 2B',
    subject: 'Physics',
    time: '10:00 AM - 11:00 AM',
    roomNo: '102',
  },
  {
    id: 3,
    className: 'Class 3C',
    subject: 'Chemistry',
    time: '11:00 AM - 12:00 PM',
    roomNo: '103',
  },
  {
    id: 4,
    className: 'Class 4D',
    subject: 'Biology',
    time: '1:00 PM - 2:00 PM',
    roomNo: '104',
  },
  {
    id: 5,
    className: 'Class 5E',
    subject: 'Computer Science',
    time: '2:00 PM - 3:00 PM',
    roomNo: '105',
  },
];

@Component({
  selector: 'app-my-classes',
  templateUrl: './my-classes.component.html',
  styleUrls: ['./my-classes.component.scss'],
  standalone: true,
  imports: [BreadcrumbComponent, MasterTableComponent],
})
export class MyClassesComponent {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'className', label: 'Class Name', type: 'text', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    { def: 'time', label: 'Time', type: 'text', visible: true },
    { def: 'roomNo', label: 'Room No', type: 'text', visible: true },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<MyClass>(MY_CLASSES_DATA);
  isLoading = false;

  handleAdd() {
    // Implement add logic
    console.log('Add new class');
  }

  handleEdit(row: MyClass) {
    // Implement edit logic
    console.log('Edit class', row);
  }

  handleDelete(row: MyClass) {
    this.dataSource.data = this.dataSource.data.filter((item) => item.id !== row.id);
  }

  handleRefresh() {
    this.dataSource.data = [...MY_CLASSES_DATA];
  }

  handleBulkDelete(selectedRows: MyClass[]) {
    this.dataSource.data = this.dataSource.data.filter(
      (item) => !selectedRows.includes(item)
    );
  }
}

