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


  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    const currentUser = this.store.get('currentUser') as User;
    if (currentUser) {
      const permission = route.data['permission'];
      if (permission) {
        if (permission === 'IDENTITY:IS_MANAGEMENT') {
          if (!this.authService.hasPermission('IDENTITY:IS_MANAGEMENT') && !this.authService.hasAdminNamespaceAccess()) {
            this.router.navigate(['/authentication/signin']);
            return false;
          }
        } else if (permission === 'IDENTITY:IS_TEACHER') {
          if (!this.authService.hasPermission('IDENTITY:IS_TEACHER') && !this.authService.hasTeacherNamespaceAccess()) {
            this.router.navigate(['/authentication/signin']);
            return false;
          }
        } else if (permission === 'IDENTITY:IS_STUDENT') {
          if (!this.authService.hasPermission('IDENTITY:IS_STUDENT') && !this.authService.hasStudentNamespaceAccess()) {
            this.router.navigate(['/authentication/signin']);
            return false;
          }
        } else if (permission === 'IDENTITY:IS_SKILL_VERIFIER') {
          if (!this.authService.hasPermission('IDENTITY:IS_SKILL_VERIFIER') && !this.authService.hasAdminNamespaceAccess()) {
            this.router.navigate(['/authentication/signin']);
            return false;
          }
        } else if (Array.isArray(permission)) {
          const hasAny = permission.some(p => this.authService.hasPermission(p));
          if (!hasAny) {
            this.router.navigate(['/authentication/signin']);
            return false;
          }
        } else if (!this.authService.hasPermission(permission)) {
          this.router.navigate(['/authentication/signin']);
          return false;
        }
      }
      return true;
    }

    // If no current user is found, redirect to signin
    this.router.navigate(['/authentication/signin']);
    return false;
  }
}
