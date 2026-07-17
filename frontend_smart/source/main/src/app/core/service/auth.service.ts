import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, catchError } from 'rxjs';
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
  orgLogo$ = new BehaviorSubject<string>('');
  schoolName$ = new BehaviorSubject<string>('');

  constructor() {
    const user = this.getUser();
    if (Object.keys(user).length > 0) {
      this.user$.next(user);
    }
    const logo = this.getOrgLogo();
    this.orgLogo$.next(logo);
    const name = this.getSchoolName();
    this.schoolName$.next(name);
    this.bootstrapOrgLogo();
    this.syncPermissions();
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
          const logoUrl = response.organization?.logo_url || '';
          const schoolName = response.organization?.school_name || '';
          console.log('Logged User', response.user);
          console.log('Permissions', response.user.permissions);
          this.setSession(response.token, response.user, permissions, rememberMe, logoUrl, schoolName);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    const frontendOrigin = window.location.origin;
    return this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email, frontendOrigin });
  }

  resetPassword(token: string, new_password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, { token, new_password });
  }

  setSession(token: string, user: any, permissions: string[], rememberMe: boolean = false, logoUrl: string = '', schoolName: string = ''): void {
    if (rememberMe) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('permissions');
      sessionStorage.removeItem('orgLogo');
      sessionStorage.removeItem('schoolName');

      this.storage.set('token', token);
      this.storage.set('currentUser', user);
      this.storage.set('permissions', permissions);
      this.storage.set('orgLogo', logoUrl);
      this.storage.set('schoolName', schoolName);
    } else {
      this.storage.remove('token');
      this.storage.remove('currentUser');
      this.storage.remove('permissions');
      this.storage.remove('orgLogo');
      this.storage.remove('schoolName');

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('permissions', JSON.stringify(permissions));
      sessionStorage.setItem('orgLogo', logoUrl);
      sessionStorage.setItem('schoolName', schoolName);
    }
    this.user$.next(user);
    this.orgLogo$.next(logoUrl);
    this.schoolName$.next(schoolName);
  }

  getOrgLogo(): string {
    if (sessionStorage.getItem('token')) {
      return sessionStorage.getItem('orgLogo') || '';
    }
    if (this.storage.has('token')) {
      return (this.storage.get('orgLogo') as string) || '';
    }
    return '';
  }

  getSchoolName(): string {
    if (sessionStorage.getItem('token')) {
      return sessionStorage.getItem('schoolName') || '';
    }
    if (this.storage.has('token')) {
      return (this.storage.get('schoolName') as string) || '';
    }
    return '';
  }

  isOrgLogoCached(): boolean {
    if (sessionStorage.getItem('token')) {
      return sessionStorage.getItem('orgLogo') !== null;
    }
    if (this.storage.has('token')) {
      return this.storage.has('orgLogo');
    }
    return false;
  }

  bootstrapOrgLogo(): void {
    if (this.isLoggedIn() && !this.isOrgLogoCached()) {
      this.http.get<any>(`${environment.apiUrl}/organizations/me/profile`).subscribe({
        next: (org) => {
          const logoUrl = org?.logo_url || '';
          const schoolName = org?.school_name || '';
          this.updateOrgLogo(logoUrl);
          this.updateSchoolName(schoolName);
        },
        error: (err) => {
          console.error('Failed to bootstrap organization logo:', err);
          // Cache as empty to prevent infinite bootstrap requests on transient failures
          this.updateOrgLogo('');
          this.updateSchoolName('');
        }
      });
    }
  }

  updateOrgLogo(logoUrl: string): void {
    if (sessionStorage.getItem('token')) {
      sessionStorage.setItem('orgLogo', logoUrl);
    }
    if (this.storage.has('token')) {
      this.storage.set('orgLogo', logoUrl);
    }
    this.orgLogo$.next(logoUrl);
  }

  syncPermissions(): void {
    if (this.isLoggedIn()) {
      this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
        next: (res) => {
          if (res && res.permissions) {
            const currentUser = this.getUser();
            this.setSession(
              this.getToken()!,
              currentUser,
              res.permissions,
              this.storage.has('token'),
              this.getOrgLogo(),
              this.getSchoolName()
            );
          }
        },
        error: (err) => console.error('Failed to sync permissions:', err)
      });
    }
  }

  updateSchoolName(schoolName: string): void {
    if (sessionStorage.getItem('token')) {
      sessionStorage.setItem('schoolName', schoolName);
    }
    if (this.storage.has('token')) {
      this.storage.set('schoolName', schoolName);
    }
    this.schoolName$.next(schoolName);
  }



  getUser(): any {
    if (sessionStorage.getItem('token')) {
      const session = sessionStorage.getItem('currentUser');
      if (session) {
        try { return JSON.parse(session); } catch(e) { return {}; }
      }
    }

    if (this.storage.has('token')) {
      const local = this.storage.get('currentUser');
      if (local && Object.keys(local).length > 0) return local;
    }
    
    return {};
  }

  getRole(): string | null {
    const user = this.getUser();
    return user ? user.role || null : null;
  }

  getPermissions(): string[] {
    let perms: string[] = [];
    if (sessionStorage.getItem('token')) {
      const session = sessionStorage.getItem('permissions');
      if (session) {
        try { perms = JSON.parse(session); } catch(e) { perms = []; }
      }
    } else if (this.storage.has('token')) {
      const local = this.storage.get('permissions') as string[];
      if (local && local.length > 0) perms = local;
    }

    // Backwards compatibility for active sessions that haven't refreshed since migration
    if (perms.includes('USERS:BULK_IMPORT') || perms.includes('USERS_BULK_IMPORT')) {
      if (!perms.includes('USERS:IMPORT')) perms.push('USERS:IMPORT');
      if (!perms.includes('USERS:EXPORT')) perms.push('USERS:EXPORT');
    }

    return perms;
  }

  getToken(): string | null {
    return sessionStorage.getItem('token') || (this.storage.get('token') as string);
  }

  decodeToken(token: string): any {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const decodedPayload = window.atob(parts[1]);
      return JSON.parse(decodedPayload);
    } catch {
      return null;
    }
  }

  getRoleFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded ? decoded.role || null : null;
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
    const clearStorage = () => {
      this.storage.remove('token');
      this.storage.remove('currentUser');
      this.storage.remove('permissions');
      this.storage.remove('orgLogo');
      this.storage.remove('schoolName');
      this.storage.remove('roleNames');
      this.storage.remove('adminToken');
      this.storage.remove('adminUser');
      this.storage.remove('adminPermissions');
      this.storage.remove('adminRemembered');

      // Clear legacy/unprefixed keys
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('permissions');
      localStorage.removeItem('orgLogo');
      localStorage.removeItem('schoolName');

      sessionStorage.removeItem('token');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('permissions');
      sessionStorage.removeItem('orgLogo');
      sessionStorage.removeItem('schoolName');

      this.user$.next({});
      this.orgLogo$.next('');
      this.schoolName$.next('');
    };

    return this.http.post<any>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => clearStorage()),
      catchError(() => {
        clearStorage();
        return of({ success: true });
      })
    );
  }

  getDefaultRoute(): string {
    if (this.hasPermission('IDENTITY', 'IS_SYSTEM_ADMIN')) return '/organization/list';
    if (this.hasPermission('IDENTITY', 'IS_SUPER_ADMIN')) return '/admin/dashboard/management-dashboard';
    if (this.hasPermission('IDENTITY', 'IS_MANAGEMENT')) return '/admin/dashboard/management-dashboard';
    if (this.hasPermission('IDENTITY', 'IS_TEACHER')) return '/teacher/dashboard';
    if (this.hasPermission('IDENTITY', 'IS_SKILL_VERIFIER')) return '/admin/administration/skills-verify';
    if (this.hasPermission('IDENTITY', 'IS_PARENT')) return '/parent/dashboard';
    if (this.hasPermission('IDENTITY', 'IS_STUDENT')) return '/student/dashboard';

    if (this.hasAdminNamespaceAccess()) return '/admin/dashboard/management-dashboard';
    if (this.hasTeacherNamespaceAccess()) return '/teacher/dashboard';
    if (this.hasStudentNamespaceAccess()) return '/student/dashboard';

    return '/authentication/signin';
  }
}
