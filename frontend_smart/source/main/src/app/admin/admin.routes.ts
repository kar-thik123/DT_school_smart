import { Route } from '@angular/router';
import { Page404Component } from 'app/authentication/page404/page404.component';

export const ADMIN_ROUTE: Route[] = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTE),
  },
  {
    path: 'front-office',
    loadChildren: () =>
      import('./front-office/front-office.routes').then(
        (m) => m.FRONT_OFFICE_ROUTE
      ),
  },
  {
    path: 'teachers',
    loadChildren: () =>
      import('./teachers/admin-teachers.routes').then(
        (m) => m.ADMIN_TEACHER_ROUTE
      ),
  },
  {
    path: 'students',
    loadChildren: () =>
      import('./students/admin-students.routes').then(
        (m) => m.ADMIN_STUDENT_ROUTE
      ),
  },
  {
    path: 'admissions',
    loadChildren: () =>
      import('./admissions/admin-admissions.routes').then(
        (m) => m.ADMIN_ADMISSION_ROUTE
      ),
  },
  {
    path: 'courses',
    loadChildren: () =>
      import('./courses/courses.routes').then((m) => m.COURSE_ROUTE),
  },
  {
    path: 'library',
    loadChildren: () =>
      import('./library/library.routes').then((m) => m.LIBRARY_ROUTE),
  },
  {
    path: 'departments',
    loadChildren: () =>
      import('./departments/departments.routes').then(
        (m) => m.DEPARTMENT_ROUTE
      ),
  },
  {
    path: 'staff',
    loadChildren: () =>
      import('./staff/staff.routes').then((m) => m.STAFF_ROUTE),
  },
  {
    path: 'holidays',
    loadChildren: () =>
      import('./holidays/holidays.routes').then((m) => m.HOLIDAY_ROUTE),
  },
  {
    path: 'communication',
    loadChildren: () =>
      import('./communication/communication.routes').then((m) => m.COMMUNICATION_ROUTE),
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.routes').then((m) => m.REPORTS_ROUTE),
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.routes').then((m) => m.SETTINGS_ROUTE),
  },
  {
    path: 'fees',
    loadChildren: () => import('./fees/fees.routes').then((m) => m.FEES_ROUTE),
  },
  {
    path: 'hostel',
    loadChildren: () =>
      import('./hostel/hostel.routes').then((m) => m.HOSTEL_ROUTE),
  },
  {
    path: 'class',
    loadChildren: () =>
      import('./class/class.routes').then((m) => m.CLASS_ROUTE),
  },
  {
    path: 'academics',
    loadChildren: () =>
      import('./academics/academics.routes').then((m) => m.ACADEMICS_ROUTE),
  },
  {
    path: 'human-resources',
    loadChildren: () =>
      import('./human-resources/human-resources.routes').then(
        (m) => m.HR_ROUTE
      ),
  },
  {
    path: 'examination',
    loadChildren: () =>
      import('./examination/admin-examination.routes').then(
        (m) => m.ADMIN_EXAMINATION_ROUTE
      ),
  },
  {
    path: 'transport',
    loadChildren: () =>
      import('./transport/transport.routes').then((m) => m.TRANSPORT_ROUTE),
  },

  // --- ADMINISTRATION MODULE (Grouped Architecture) ---
  {
    path: 'administration',
    children: [
      {
        path: 'roles',
        loadComponent: () =>
          import('./settings/role-permissions/role-permissions.component').then(
            (m) => m.RolePermissionsComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./settings/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'master-config',
        loadComponent: () =>
          import('./administration/master-config/master-config.component').then(
            (m) => m.MasterConfigComponent
          ),
      },
      {
        path: 'academic-structure',
        loadComponent: () =>
          import('./administration/academic-structure/academic-structure.component').then(
            (m) => m.AcademicStructureComponent
          ),
      },
    ]
  },

  // --- BACKWARD COMPATIBILITY REDIRECTS ---
  { path: 'roles', redirectTo: 'administration/roles', pathMatch: 'full' },
  { path: 'users', redirectTo: 'administration/users', pathMatch: 'full' },
  { path: 'master-config', redirectTo: 'administration/master-config', pathMatch: 'full' },

  { path: '**', component: Page404Component },
];
