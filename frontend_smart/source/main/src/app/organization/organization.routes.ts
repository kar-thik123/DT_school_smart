import { Route } from '@angular/router';
import { SetupComponent } from './setup/setup.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ListComponent } from './list/list.component';
import { ManageComponent } from './manage/manage.component';

export const ORGANIZATION_ROUTE: Route[] = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'list',
    component: ListComponent,
  },
  {
    path: 'setup',
    component: SetupComponent,
  },
  {
    path: 'manage/:id',
    component: ManageComponent,
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/roles.component').then(m => m.RolesComponent)
  }
];

