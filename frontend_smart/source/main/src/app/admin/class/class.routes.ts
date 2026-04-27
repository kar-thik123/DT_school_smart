import { Route } from '@angular/router';
import { Page404Component } from 'app/authentication/page404/page404.component';
import { ClassListComponent } from './class-list/class-list.component';
import { ClassTimetableComponent } from './class-timetable/class-timetable.component';

export const CLASS_ROUTE: Route[] = [
  {
    path: 'class-list',
    component: ClassListComponent,
  },
  {
    path: 'class-timetable',
    component: ClassTimetableComponent,
  },
  { path: '**', component: Page404Component },
];
