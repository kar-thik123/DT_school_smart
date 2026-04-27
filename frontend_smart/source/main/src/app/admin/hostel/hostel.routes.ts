import { Route } from '@angular/router';
import { Page404Component } from 'app/authentication/page404/page404.component';
import { HostelRoomListComponent } from './hostel-room-list/hostel-room-list.component';
import { HostelRoomTypeComponent } from './hostel-room-type/hostel-room-type.component';
import { AllocationsComponent } from './allocations/allocations.component';
import { AttendanceComponent } from './attendance/attendance.component';
import { HostelFeesComponent } from './hostel-fees/hostel-fees.component';

export const HOSTEL_ROUTE: Route[] = [
  {
    path: 'room-list',
    component: HostelRoomListComponent,
  },
  {
    path: 'room-type',
    component: HostelRoomTypeComponent,
  },
  {
    path: 'allocations',
    component: AllocationsComponent,
  },
  {
    path: 'attendance',
    component: AttendanceComponent,
  },
  {
    path: 'hostel-fees',
    component: HostelFeesComponent,
  },
  { path: '**', component: Page404Component },
];
