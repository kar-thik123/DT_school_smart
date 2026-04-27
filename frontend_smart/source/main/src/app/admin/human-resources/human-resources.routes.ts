import { Route } from '@angular/router';
import { Page404Component } from '../../authentication/page404/page404.component';
import { LeaveRequestsComponent } from './leave-requests/leave-requests.component';
import { LeaveBalanceComponent } from './leave-balance/leave-balance.component';
import { LeaveTypesComponent } from './leave-types/leave-types.component';
import { AllHolidayComponent } from './all-holidays/all-holidays.component';
import { TodaysAttendanceComponent } from './todays-attendance/todays-attendance.component';
import { AttendanceSheetComponent } from './attendance-sheet/attendance-sheet.component';
import { EmployeeSalaryComponent } from './employee-salary/employee-salary.component';
import { PayslipComponent } from './payslip/payslip.component';
import { AttendanceDetailComponent } from './attendance-detail/attendance-detail.component';
export const HR_ROUTE: Route[] = [
  {
    path: 'leave-requests',
    component: LeaveRequestsComponent,
  },
  {
    path: 'leave-balance',
    component: LeaveBalanceComponent,
  },
  {
    path: 'leave-types',
    component: LeaveTypesComponent,
  },
  {
    path: 'holidays',
    component: AllHolidayComponent,
  },
  {
    path: 'todays-attendance',
    component: TodaysAttendanceComponent,
  },
  {
    path: 'attendance-detail',
    component: AttendanceDetailComponent,
  },
  {
    path: 'attendance-sheet',
    component: AttendanceSheetComponent,
  },
  {
    path: 'employee-salary',
    component: EmployeeSalaryComponent,
  },
  {
    path: 'payslip',
    component: PayslipComponent,
  },
  { path: '**', component: Page404Component },
];
