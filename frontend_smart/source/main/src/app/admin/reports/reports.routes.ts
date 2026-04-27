import { Route } from '@angular/router';
import { AcademicReportsComponent } from './academic-reports/academic-reports.component';
import { AttendanceReportsComponent } from './attendance-reports/attendance-reports.component';
import { FeeReportsComponent } from './fee-reports/fee-reports.component';
import { ExamReportsComponent } from './exam-reports/exam-reports.component';
import { CustomReportsComponent } from './custom-reports/custom-reports.component';
import { Page404Component } from 'app/authentication/page404/page404.component';

export const REPORTS_ROUTE: Route[] = [
  {
    path: 'academic-reports',
    component: AcademicReportsComponent,
  },
  {
    path: 'attendance-reports',
    component: AttendanceReportsComponent,
  },
  {
    path: 'fee-reports',
    component: FeeReportsComponent,
  },
  {
    path: 'exam-reports',
    component: ExamReportsComponent,
  },
  {
    path: 'custom-reports',
    component: CustomReportsComponent,
  },
  { path: '**', component: Page404Component },
];
