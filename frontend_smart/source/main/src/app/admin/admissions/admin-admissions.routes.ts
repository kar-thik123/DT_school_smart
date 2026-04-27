import { Route } from '@angular/router';
import { AdmissionEnquiriesComponent } from './admission-enquiries/admission-enquiries.component';
import { OnlineApplicationsComponent } from './online-applications/online-applications.component';
import { EntranceExamsComponent } from './entrance-exams/entrance-exams.component';
import { MeritListComponent } from './merit-list/merit-list.component';
import { SeatAllocationComponent } from './seat-allocation/seat-allocation.component';
import { Page404Component } from 'app/authentication/page404/page404.component';

export const ADMIN_ADMISSION_ROUTE: Route[] = [
  {
    path: 'admission-enquiries',
    component: AdmissionEnquiriesComponent,
  },
  {
    path: 'online-applications',
    component: OnlineApplicationsComponent,
  },
  {
    path: 'entrance-exams',
    component: EntranceExamsComponent,
  },
  {
    path: 'merit-list',
    component: MeritListComponent,
  },
  {
    path: 'seat-allocation',
    component: SeatAllocationComponent,
  },
  { path: '**', component: Page404Component },
];
