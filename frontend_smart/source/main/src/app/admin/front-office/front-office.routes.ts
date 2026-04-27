import { Route } from '@angular/router';
import { Page404Component } from 'app/authentication/page404/page404.component';
import { AdmissionInquiryComponent } from './admission-inquiry/admission-inquiry.component';
import { VisitorsComponent } from './visitors/visitors.component';
import { ComplaintsComponent } from './complaints/complaints.component';

export const FRONT_OFFICE_ROUTE: Route[] = [
  {
    path: 'admission-inquiry',
    component: AdmissionInquiryComponent,
  },
  {
    path: 'visitors',
    component: VisitorsComponent,
  },
  {
    path: 'complaints',
    component: ComplaintsComponent,
  },
  { path: '**', component: Page404Component },
];
