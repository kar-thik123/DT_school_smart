import { Injectable, inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

import { LocalStorageService } from '@shared/services';
import { User } from '@core/models/interface';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private router = inject(Router);
  private store = inject(LocalStorageService);
  private authService = inject(AuthService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const handleDenial = () => {
      if (this.authService.isLoggedIn()) {
        const defaultRoute = this.authService.getDefaultRoute();
        if (state.url !== defaultRoute && defaultRoute !== '/authentication/signin') {
          this.router.navigate([defaultRoute]);
        } else {
          this.router.navigate(['/authentication/signin']);
        }
      } else {
        this.router.navigate(['/authentication/signin']);
      }
      return false;
    };

    // 1. Validate authentication (JWT exists and is valid)
    if (!this.authService.isLoggedIn()) {
      return handleDenial();
    }
    const token = this.authService.getToken();
    if (!token) {
      return handleDenial();
    }

    // 2. Determine the namespace from the requested URL
    const url = state.url || '';
    let namespace: 'PLATFORM' | 'TENANT' | 'NONE' = 'NONE';
    if (url.includes('/organization')) {
      namespace = 'PLATFORM';
    } else if (
      url.startsWith('/admin') ||
      url.startsWith('/teacher') ||
      url.startsWith('/student') ||
      url.startsWith('/parent')
    ) {
      namespace = 'TENANT';
    }

    // 3. Decode the signed JWT
    const decodedToken = this.authService.decodeToken(token);
    if (!decodedToken) {
      return handleDenial();
    }

    // 4. Verify that the signed JWT role matches the current authenticated session (tampering detection)
    const currentUser = this.authService.currentUserValue;
    const tokenRole = (decodedToken.role || '').toUpperCase();
    const sessionRole = (currentUser?.role || '').toUpperCase();
    if (!tokenRole || tokenRole !== sessionRole) {
      return handleDenial();
    }

    // 5. Verify namespace membership (Platform vs Tenant boundaries)
    const isSystemAdmin = tokenRole === 'SYSTEM_ADMIN';
    if (namespace === 'PLATFORM' && !isSystemAdmin) {
      return handleDenial();
    }
    if (namespace === 'TENANT' && isSystemAdmin) {
      return handleDenial();
    }

    // Enforce matching sub-namespaces within Tenant namespace
    if (url.startsWith('/admin/')) {
      if (!['ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(sessionRole)) {
        return handleDenial();
      }
    }
    if (url.startsWith('/teacher/')) {
      if (sessionRole !== 'TEACHER') {
        return handleDenial();
      }
    }
    if (url.startsWith('/student/')) {
      if (sessionRole !== 'STUDENT') {
        return handleDenial();
      }
    }
    if (url.startsWith('/parent/')) {
      if (sessionRole !== 'PARENT') {
        return handleDenial();
      }
    }

    // 6. Evaluate the required permission using this.authService.hasPermission(permission)
    const permission = route.data['permission'];
    if (permission) {
      if (permission === 'IDENTITY:IS_MANAGEMENT') {
        if (!this.authService.hasPermission('IDENTITY:IS_MANAGEMENT') && !this.authService.hasAdminNamespaceAccess()) {
          return handleDenial();
        }
      } else if (permission === 'IDENTITY:IS_TEACHER') {
        if (!this.authService.hasPermission('IDENTITY:IS_TEACHER') && !this.authService.hasTeacherNamespaceAccess()) {
          return handleDenial();
        }
      } else if (permission === 'IDENTITY:IS_STUDENT') {
        if (!this.authService.hasPermission('IDENTITY:IS_STUDENT') && !this.authService.hasStudentNamespaceAccess()) {
          return handleDenial();
        }
      } else if (permission === 'IDENTITY:IS_SKILL_VERIFIER') {
        if (!this.authService.hasPermission('IDENTITY:IS_SKILL_VERIFIER') && !this.authService.hasAdminNamespaceAccess()) {
          return handleDenial();
        }
      } else if (Array.isArray(permission)) {
        const hasAny = permission.some(p => this.authService.hasPermission(p));
        if (!hasAny) {
          return handleDenial();
        }
      } else if (!this.authService.hasPermission(permission)) {
        return handleDenial();
      }
    }

    // 7. Allow or deny access
    return true;
  }
}
