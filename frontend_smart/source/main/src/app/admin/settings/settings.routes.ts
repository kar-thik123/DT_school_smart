import { Route } from '@angular/router';
import { InstituteProfileComponent } from './institute-profile/institute-profile.component';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { AcademicRulesComponent } from './academic-rules/academic-rules.component';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { SystemLogsComponent } from './system-logs/system-logs.component';
import { BackupRestoreComponent } from './backup-restore/backup-restore.component';

export const SETTINGS_ROUTE: Route[] = [
  {
    path: 'institute-profile',
    component: InstituteProfileComponent,
  },
  {
    path: 'role-permissions',
    component: RolePermissionsComponent,
  },
  {
    path: 'user-management',
    component: UserManagementComponent,
  },
  {
    path: 'academic-rules',
    component: AcademicRulesComponent,
  },
  {
    path: 'notification-settings',
    component: NotificationSettingsComponent,
  },
  {
    path: 'system-logs',
    component: SystemLogsComponent,
  },
  {
    path: 'backup-restore',
    component: BackupRestoreComponent,
  },
];
