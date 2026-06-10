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

  login(email: string, password: string, rememberMe: boolean = false): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response) => {
        if (response && response.token) {
          // Permissions are in res.user.permissions per backend alignment
          const permissions = response.user.permissions || [];
          console.log('Logged User', response.user);
          console.log('Permissions', response.user.permissions);
          this.setSession(response.token, response.user, permissions, rememberMe);
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

  setSession(token: string, user: any, permissions: string[], rememberMe: boolean = false): void {
    if (rememberMe) {
      this.storage.set('token', token);
      this.storage.set('currentUser', user);
      this.storage.set('permissions', permissions);
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('permissions', JSON.stringify(permissions));
    }
    this.user$.next(user);
  }

  startImpersonation(token: string, user: any, permissions: string[]): void {
    // Save current admin session
    const currentToken = this.storage.get('token') || sessionStorage.getItem('token');
    const currentUser = this.getUser();
    const currentPermissions = this.getPermissions();
    const isRemembered = this.storage.has('token');

    this.storage.set('adminToken', currentToken);
    this.storage.set('adminUser', currentUser);
    this.storage.set('adminPermissions', currentPermissions);
    this.storage.set('adminRemembered', isRemembered);

    // Set tenant session (we use sessionStorage for impersonated session to avoid leaking)
    this.setSession(token, user, permissions, false);
  }

  stopImpersonation(): void {
    const adminToken = this.storage.get('adminToken');
    const adminUser = this.storage.get('adminUser');
    const adminPermissions = this.storage.get('adminPermissions') as string[];
    const adminRemembered = this.storage.get('adminRemembered') as boolean;

    if (adminToken && typeof adminToken === 'string' && adminToken !== '{}') {
      this.setSession(adminToken, adminUser, adminPermissions, adminRemembered);
      this.storage.remove('adminToken');
      this.storage.remove('adminUser');
      this.storage.remove('adminPermissions');
      this.storage.remove('adminRemembered');
    }
  }

  isImpersonating(): boolean {
    return this.storage.has('adminToken');
  }

  getUser(): any {
    const local = this.storage.get('currentUser');
    if (local && Object.keys(local).length > 0) return local;
    
    const session = sessionStorage.getItem('currentUser');
    if (session) {
      try { return JSON.parse(session); } catch(e) { return {}; }
    }
    return {};
  }

  getRole(): string | null {
    const user = this.getUser();
    return user ? user.role || null : null;
  }

  getPermissions(): string[] {
    const local = this.storage.get('permissions') as string[];
    if (local && local.length > 0) return local;
    
    const session = sessionStorage.getItem('permissions');
    if (session) {
      try { return JSON.parse(session); } catch(e) { return []; }
    }
    return [];
  }

  isLoggedIn(): boolean {
    return this.storage.has('token') || !!sessionStorage.getItem('token');
  }

  hasPermission(moduleOrPermission: string, action?: string): boolean {
    const user = this.user$.value;
    if (!user || Object.keys(user).length === 0) return false;

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

    return false;
  }

  hasAdminNamespaceAccess(): boolean {
    if (this.hasPermission('IDENTITY', 'IS_SUPER_ADMIN') || this.hasPermission('IDENTITY', 'IS_MANAGEMENT')) {
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
      'COMPLETION:VIEW', 'COMPLETION_VIEW',
      'SKILLS_VERIFICATION:VIEW', 'SKILLS_VERIFICATION_VIEW',
      'SKILLS_VERIFY_ASSIGNMENT:VIEW', 'SKILLS_VERIFY_ASSIGNMENT_VIEW',
      'IDENTITY:IS_SKILL_VERIFIER', 'IDENTITY_IS_SKILL_VERIFIER'
    ];
    return adminPermissions.some(perm => this.hasPermission(perm));
  }

  hasTeacherNamespaceAccess(): boolean {
    if (this.hasPermission('IDENTITY', 'IS_TEACHER')) {
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
    return this.hasPermission('IDENTITY', 'IS_STUDENT');
  }

  logout(): Observable<any> {
    this.storage.remove('token');
    this.storage.remove('currentUser');
    this.storage.remove('permissions');
    this.storage.remove('roleNames');
    this.storage.remove('adminToken');
    this.storage.remove('adminUser');
    this.storage.remove('adminPermissions');
    this.storage.remove('adminRemembered');

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('permissions');

    this.user$.next({});
    return of({ success: true });
  }

  getDefaultRoute(): string {
    if (this.hasPermission('IDENTITY', 'IS_SYSTEM_ADMIN')) return '/organization/list';
    if (this.hasPermission('IDENTITY', 'IS_SUPER_ADMIN')) return '/admin/dashboard/main';
    if (this.hasPermission('IDENTITY', 'IS_MANAGEMENT')) return '/admin/dashboard/main';
    if (this.hasPermission('IDENTITY', 'IS_TEACHER')) return '/teacher/dashboard';
    if (this.hasPermission('IDENTITY', 'IS_SKILL_VERIFIER')) return '/admin/administration/skills-verify';
    if (this.hasPermission('IDENTITY', 'IS_PARENT')) return '/parent/dashboard';
    if (this.hasPermission('IDENTITY', 'IS_STUDENT')) return '/student/dashboard';
    return '/authentication/signin';
  }
}
