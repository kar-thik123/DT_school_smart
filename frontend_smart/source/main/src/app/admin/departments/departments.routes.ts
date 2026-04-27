import { Route } from '@angular/router';
import { AllDepartmentsComponent } from './all-departments/all-departments.component';
import { AddDepartmentComponent } from './add-department/add-department.component';
import { EditDepartmentComponent } from './edit-department/edit-department.component';
import { Page404Component } from 'app/authentication/page404/page404.component';

export const DEPARTMENT_ROUTE: Route[] = [
  {
    path: 'all-departments',
    component: AllDepartmentsComponent,
  },
  {
    path: 'add-department',
    component: AddDepartmentComponent,
  },
  {
    path: 'edit-department',
    component: EditDepartmentComponent,
  },
  { path: '**', component: Page404Component },
];
