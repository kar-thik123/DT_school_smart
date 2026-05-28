import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '@core/models/interface';
import { LocalStorageService } from '@shared/services';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(LocalStorageService);

  user$ = new BehaviorSubject<any>({});

  constructor() {
    const user = this.getUser();
    if (Object.keys(user).length > 0) {
      this.user$.next(user);
    }
  }

  public get currentUserValue(): any {
    return this.getUser();
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response) => {
        if (response && response.token) {
          // Permissions are in res.user.permissions per backend alignment
          const permissions = response.user.permissions || [];
          console.log('Logged User', response.user);
          console.log('Permissions', response.user.permissions);
          this.setSession(response.token, response.user, permissions);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, new_password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, { token, new_password });
  }

  setSession(token: string, user: any, permissions: string[]): void {
    this.storage.set('token', token);
    this.storage.set('currentUser', user);
    this.storage.set('permissions', permissions);
    this.user$.next(user);
  }

  startImpersonation(token: string, user: any, permissions: string[]): void {
    // Save current admin session
    this.storage.set('adminToken', this.storage.get('token'));
    this.storage.set('adminUser', this.storage.get('currentUser'));
    this.storage.set('adminPermissions', this.storage.get('permissions'));

    // Set tenant session
    this.setSession(token, user, permissions);
  }

  stopImpersonation(): void {
    const adminToken = this.storage.get('adminToken');
    const adminUser = this.storage.get('adminUser');
    const adminPermissions = this.storage.get('adminPermissions') as string[];

    if (adminToken && typeof adminToken === 'string' && adminToken !== '{}') {
      this.setSession(adminToken, adminUser, adminPermissions);
      this.storage.remove('adminToken');
      this.storage.remove('adminUser');
      this.storage.remove('adminPermissions');
    }
  }

  isImpersonating(): boolean {
    return this.storage.has('adminToken');
  }

  getUser(): any {
    return this.storage.get('currentUser') || {};
  }

  getRole(): string | null {
    const user = this.getUser();
    return user ? user.role || null : null;
  }

  getPermissions(): string[] {
    return (this.storage.get('permissions') as string[]) || [];
  }

  isLoggedIn(): boolean {
    return this.storage.has('token');
  }

  hasPermission(moduleOrPermission: string, action?: string): boolean {
    const user = this.user$.value;
    if (!user || Object.keys(user).length === 0) return false;

    // SYSTEM_ADMIN owns the platform; other roles are permission-driven.
    // NOTE: Removed global bypass for SYSTEM_ADMIN to enforce strict tenant isolation
    const role = (user.role || user.roles?.[0]?.name || '').toUpperCase();

    const permissions = this.getPermissions() || [];
    
    // Normalize both user permissions and the permission to check
    const normalizedUserPermissions = new Set<string>();
    permissions.forEach(p => {
      if (p) {
        normalizedUserPermissions.add(p);
        normalizedUserPermissions.add(p.replace(':', '_'));
      }
    });

    const permissionToCheck = action ? `${moduleOrPermission}:${action}` : moduleOrPermission;
    const permissionToCheckUnderscore = action ? `${moduleOrPermission}_${action}` : moduleOrPermission.replace(':', '_');

    if (normalizedUserPermissions.has(permissionToCheck) || normalizedUserPermissions.has(permissionToCheckUnderscore)) {
      return true;
    }

    // Fallback: If DB permissions are empty, check the base role string
    if (role === 'MANAGEMENT' && (permissionToCheck === 'IDENTITY:IS_MANAGEMENT' || permissionToCheckUnderscore === 'IDENTITY_IS_MANAGEMENT')) return true;
    if (role === 'TEACHER' && (permissionToCheck === 'IDENTITY:IS_TEACHER' || permissionToCheckUnderscore === 'IDENTITY_IS_TEACHER')) return true;
    if (role === 'STUDENT' && (permissionToCheck === 'IDENTITY:IS_STUDENT' || permissionToCheckUnderscore === 'IDENTITY_IS_STUDENT')) return true;

    return false;
  }

  hasAdminNamespaceAccess(): boolean {
    const user = this.user$.value;
    if (!user || Object.keys(user).length === 0) return false;
    const role = (user.role || '').toUpperCase();
    if (role === 'SUPER_ADMIN' || role === 'MANAGEMENT') {
      return true;
    }
    // Or check if they have any admin sub-module permission
    const adminPermissions = [
      'USERS:VIEW', 'USERS_VIEW',
      'ROLES_AND_PERMISSIONS:VIEW', 'ROLES_AND_PERMISSIONS_VIEW',
      'ORGANIZATION:MANAGE_CONFIG', 'ORGANIZATION_MANAGE_CONFIG',
      'ACADEMIC_STRUCTURE:VIEW', 'ACADEMIC_STRUCTURE_VIEW',
      'ACADEMIC:MANAGE_SYLLABUS', 'UNITS_LIST:MANAGE_SYLLABUS',
      'TEACHER_ASSIGNMENT:VIEW', 'TEACHER_ASSIGNMENT_VIEW',
      'MASTER_CONFIGURATION:VIEW', 'MASTER_CONFIGURATION_VIEW',
      'QUESTION_BANK:VIEW', 'QUESTION_BANK_VIEW',
      'COMPLETION_TRACKING:VIEW', 'COMPLETION_TRACKING_VIEW',
      'COMPLETION:VIEW', 'COMPLETION_VIEW'
    ];
    return adminPermissions.some(perm => this.hasPermission(perm));
  }

  hasTeacherNamespaceAccess(): boolean {
    const user = this.user$.value;
    if (!user || Object.keys(user).length === 0) return false;
    const role = (user.role || '').toUpperCase();
    if (role === 'TEACHER') {
      return true;
    }
    // Or check if they have teacher sub-module permissions
    const teacherPermissions = [
      'QUESTION_BANK:VIEW', 'QUESTION_BANK_VIEW',
      'COMPLETION_TRACKING:VIEW', 'COMPLETION_TRACKING_VIEW',
      'COMPLETION:VIEW', 'COMPLETION_VIEW',
      'ANALYTICS:VIEW_OWN', 'ANALYTICS_VIEW_OWN'
    ];
    return teacherPermissions.some(perm => this.hasPermission(perm));
  }

  hasStudentNamespaceAccess(): boolean {
    const user = this.user$.value;
    if (!user || Object.keys(user).length === 0) return false;
    const role = (user.role || '').toUpperCase();
    return role === 'STUDENT';
  }

  logout(): Observable<any> {
    this.storage.remove('token');
    this.storage.remove('currentUser');
    this.storage.remove('permissions');
    this.storage.remove('roleNames');
    this.storage.remove('adminToken');
    this.storage.remove('adminUser');
    this.storage.remove('adminPermissions');
    this.user$.next({});
    return of({ success: true });
  }

  getDefaultRoute(): string {
    const user = this.getUser();
    const role = user?.role;

    // Role-name fallback: protects first-time login where permissions[] may
    // be transiently empty (e.g. before ngx-permissions loads from storage).
    // Role name is always present in the stored currentUser object.
    if (role === 'SYSTEM_ADMIN') return '/organization/list';
    if (role === 'SUPER_ADMIN') return '/admin/dashboard/main';

    // Permission-driven routing for all other roles
    if (this.hasPermission('IDENTITY', 'IS_SYSTEM_ADMIN')) return '/organization/list';
    if (this.hasPermission('IDENTITY', 'IS_SUPER_ADMIN')) return '/admin/dashboard/main';
    if (this.hasPermission('IDENTITY', 'IS_MANAGEMENT')) return '/admin/dashboard/main';
    if (this.hasPermission('IDENTITY', 'IS_TEACHER')) return '/teacher/dashboard';
    if (this.hasPermission('IDENTITY', 'IS_STUDENT')) return '/student/dashboard';
    return '/authentication/signin';
  }
}
