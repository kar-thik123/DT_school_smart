import { Injectable, inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

import { LocalStorageService } from '@shared/services';
import { User } from '@core/models/interface';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private router = inject(Router);
  private store = inject(LocalStorageService);


  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    const currentUser = this.store.get('currentUser') as User;
    if (currentUser) {
      // Support both roles array (legacy/multi-role) and singular role string (backend alignment)
      const userRole = currentUser.role || currentUser.roles?.[0]?.name;
      
      // If no role exists, redirect to signin
      if (!userRole) {
        this.router.navigate(['/authentication/signin']);
        return false;
      }

      // Check if the route requires a specific role and if the user's role matches
      if (route.data['role'] && route.data['role'].indexOf(userRole) === -1) {
        // If the role does not match, navigate to the signin page
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
