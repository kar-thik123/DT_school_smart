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
      // Support checking route permission capability
      if (route.data['permission'] && !this.authService.hasPermission(route.data['permission'])) {
        this.router.navigate(['/authentication/signin']);
        return false;
      }
      return true;
    }

    // If no current user is found, redirect to signin
    this.router.navigate(['/authentication/signin']);
    return false;
  }
}
