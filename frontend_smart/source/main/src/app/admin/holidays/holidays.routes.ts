import { Route } from '@angular/router';
import { AllHolidaysComponent } from './all-holidays/all-holidays.component';
import { AddHolidayComponent } from './add-holiday/add-holiday.component';
import { EditHolidayComponent } from './edit-holiday/edit-holiday.component';
import { Page404Component } from 'app/authentication/page404/page404.component';

export const HOLIDAY_ROUTE: Route[] = [
  {
    path: 'all-holidays',
    component: AllHolidaysComponent,
  },
  {
    path: 'add-holiday',
    component: AddHolidayComponent,
  },
  {
    path: 'edit-holiday',
    component: EditHolidayComponent,
  },
  { path: '**', component: Page404Component },
];
