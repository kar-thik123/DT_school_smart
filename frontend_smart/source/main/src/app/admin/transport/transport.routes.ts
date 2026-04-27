import { Route } from '@angular/router';
import { Page404Component } from '../../authentication/page404/page404.component';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { RoutesPageComponent } from './routes-page/routes-page.component';
import { DriversComponent } from './drivers/drivers.component';
import { StudentAllocationComponent } from './student-allocation/student-allocation.component';
import { TransportFeesComponent } from './transport-fees/transport-fees.component';

export const TRANSPORT_ROUTE: Route[] = [
  {
    path: 'vehicles',
    component: VehiclesComponent,
  },
  {
    path: 'routes',
    component: RoutesPageComponent,
  },
  {
    path: 'drivers',
    component: DriversComponent,
  },
  {
    path: 'student-allocation',
    component: StudentAllocationComponent,
  },
  {
    path: 'transport-fees',
    component: TransportFeesComponent,
  },
  { path: '**', component: Page404Component },
];
