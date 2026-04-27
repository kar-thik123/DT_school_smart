import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';

export interface PeriodicElement {
  id: number;
  img: string; // Changed from imageUrl to img
  name: string;
  email: string;
  subject: string;
  status: string;
  assignTo: string;
  date: string;
  action: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    id: 1,
    img: 'assets/images/user/user1.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 2,
    img: 'assets/images/user/user2.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 3,
    img: 'assets/images/user/user3.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'open',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 4,
    img: 'assets/images/user/user4.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 5,
    img: 'assets/images/user/user5.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'open',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 6,
    img: 'assets/images/user/user6.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 7,
    img: 'assets/images/user/user7.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'open',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 8,
    img: 'assets/images/user/user8.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'pending',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 9,
    img: 'assets/images/user/user9.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 10,
    img: 'assets/images/user/user10.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 11,
    img: 'assets/images/user/user1.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'open',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 12,
    img: 'assets/images/user/user2.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 13,
    img: 'assets/images/user/user3.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'pending',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 14,
    img: 'assets/images/user/user4.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 15,
    img: 'assets/images/user/user5.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 16,
    img: 'assets/images/user/user6.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'pending',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 17,
    img: 'assets/images/user/user7.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
  {
    id: 18,
    img: 'assets/images/user/user8.jpg',
    name: 'Tim Hank',
    email: 'test@example.com',
    subject: 'Image not Proper',
    status: 'closed',
    assignTo: 'John Deo',
    date: '27/05/2016',
    action: '',
  },
];
@Component({
    selector: 'app-support',
    templateUrl: './support.component.html',
    styleUrls: ['./support.component.scss'],
    imports: [
        BreadcrumbComponent,
        MasterTableComponent
    ]
})
export class SupportComponent {
  columnDefinitions: ColumnDefinition[] = [
    { def: 'select', label: 'Checkbox', type: 'check', visible: true },
    { def: 'name', label: 'Opened By', type: 'nameWithImage', visible: true },
    { def: 'email', label: 'Email', type: 'email', visible: true },
    { def: 'subject', label: 'Subject', type: 'text', visible: true },
    {
      def: 'status', label: 'Status', type: 'status', visible: true,
      statusBadgeMap: {
        'open': 'badge-solid-red',
        'closed': 'badge-solid-green',
        'pending': 'badge-solid-purple'
      }
    },
    { def: 'assignTo', label: 'Assign To', type: 'text', visible: true },
    { def: 'date', label: 'Date', type: 'text', visible: true }, // Keeping text as it's string in data
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  breadscrums = [
    {
      title: 'Support',
      items: ['Apps'],
      active: 'Support',
    },
  ];
  constructor() {
    //constructor
  }
}
