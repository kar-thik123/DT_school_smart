import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { NgxRolesService, NgxPermissionsService } from 'ngx-permissions';
import { User } from '@core/models/interface';

@Injectable({
  providedIn: 'root',
})
export class StartupService {
  private rolesService = inject(NgxRolesService);
  private permissonsService = inject(NgxPermissionsService);
  private authService = inject(AuthService);


  /**
   * Load the application only after get the menu or other essential informations
   * such as permissions and roles.
   */

  // load(user: User) {
  //   return this.setPermissions(user);
  // }

  load() {
    return this.authService.user$
      .pipe(
        tap((user: any) => {
          return this.setPermissions(user);
        })
      )
      .subscribe();
  }

  private setPermissions(user: any) {
    const permissions = this.authService.getPermissions();
    const roleName = this.authService.getRole() || user?.role;
    
    if (permissions && permissions.length > 0) {
      this.permissonsService.loadPermissions(permissions);
    }
    
    this.rolesService.flushRoles();
    
    if (roleName) {
      const role: any = {};
      role[roleName] = permissions || [];
      this.rolesService.addRolesWithPermissions(role);
    }
  }
}
