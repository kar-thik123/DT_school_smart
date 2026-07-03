import { Route } from '@angular/router';
import { Page404Component } from 'app/authentication/page404/page404.component';
import { AuthGuard } from '@core/guard/auth.guard';

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
        canActivate: [AuthGuard],
        data: { permission: 'ROLES_AND_PERMISSIONS:VIEW' },
        loadComponent: () =>
          import('./settings/role-permissions/role-permissions.component').then(
            (m) => m.RolePermissionsComponent
          ),
      },
      {
        path: 'users',
        canActivate: [AuthGuard],
        data: { permission: 'USERS:VIEW' },
        loadComponent: () =>
          import('./settings/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'master-config',
        canActivate: [AuthGuard],
        data: { permission: 'MASTER_CONFIGURATION:VIEW' },
        loadComponent: () =>
          import('./administration/master-config/master-config.component').then(
            (m) => m.MasterConfigComponent
          ),
      },
      {
        path: 'academic-structure',
        canActivate: [AuthGuard],
        data: { permission: ['ACADEMIC_STRUCTURE:VIEW', 'ACADEMIC_STRUCTURE:READ'] },
        loadComponent: () =>
          import('./administration/academic-structure/academic-structure.component').then(
            (m) => m.AcademicStructureComponent
          ),
      },
      {
        path: 'units-list',
        canActivate: [AuthGuard],
        data: { permission: 'UNITS_LIST:MANAGE_SYLLABUS' },
        loadComponent: () =>
          import('./administration/units-list/units.component').then(
            (m) => m.UnitsListComponent
          ),
      },
      {
        path: 'question-bank',
        canActivate: [AuthGuard],
        data: { permission: 'QUESTION_BANK:VIEW' },
        loadComponent: () =>
          import('./administration/question-bank/question-bank.component').then(
            (m) => m.QuestionBankComponent
          ),
      },
      {
        path: 'teacher-assignment',
        canActivate: [AuthGuard],
        data: { permission: 'TEACHER_ASSIGNMENT:VIEW' },
        loadComponent: () =>
          import('./administration/teacher-assignment/teacher-assignment.component').then(
            (m) => m.TeacherAssignmentComponent
          ),
      },
      {
        path: 'student-mapping',
        canActivate: [AuthGuard],
        data: { permission: ['STUDENT_ENROLLMENT:VIEW', 'STUDENT_ENROLLMENT:READ', 'ACADEMIC_STRUCTURE:VIEW'] },
        loadComponent: () =>
          import('./administration/student-mapping/student-mapping.component').then(
            (m) => m.StudentMappingComponent
          ),
      },
      {
        path: 'completion-mgmt',
        canActivate: [AuthGuard],
        data: { permission: 'COMPLETION_TRACKING:VIEW' },
        loadComponent: () =>
          import('./administration/completion-mgmt/completion-mgmt.component').then(
            (m) => m.CompletionMgmtComponent
          ),
      },
      {
        path: 'settings',
        canActivate: [AuthGuard],
        data: { permission: 'MASTER_CONFIGURATION:VIEW' },
        loadComponent: () =>
          import('./administration/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      {
        path: 'skills-verify',
        canActivate: [AuthGuard],
        data: { permission: ['IDENTITY:IS_SKILL_VERIFIER', 'SKILLS_VERIFICATION:VIEW', 'SKILLS_VERIFICATION_VIEW'] },
        loadComponent: () =>
          import('./administration/skills-verify/skills-verify.component').then(
            (m) => m.SkillsVerifyComponent
          ),
      },
      {
        path: 'skills-verify-assignment',
        canActivate: [AuthGuard],
        data: { permission: 'SKILLS_VERIFY_ASSIGNMENT:VIEW' },
        loadComponent: () =>
          import('./administration/skills-verify-assignment/skills-verify-assignment.component').then(
            (m) => m.SkillsVerifyAssignmentComponent
          ),
      },
      {
        path: 'staff-attendance',
        canActivate: [AuthGuard],
        data: { permission: ['STAFF_ATTENDANCE:VIEW', 'STAFF_ATTENDANCE_VIEW', 'IDENTITY:IS_SUPER_ADMIN', 'IDENTITY:IS_MANAGEMENT'] },
        loadComponent: () =>
          import('./administration/staff-attendance/staff-attendance.component').then(
            (m) => m.StaffAttendanceComponent
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
