import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, merge, Observable, of, share, switchMap } from 'rxjs';
import { User } from '@core/models/interface';
import { LocalStorageService } from '@shared/services';
import { TokenService } from './token.service';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenService = inject(TokenService);
  private loginService = inject(LoginService);
  private store = inject(LocalStorageService);

  user$ = new BehaviorSubject<User>({});

  private change$ = merge(this.tokenService.change()).pipe(
    switchMap(() => {
      return this.assignUser(this.user$);
    }),
    share()
  );

  public get currentUserValue(): User {
    const user = this.store.get('currentUser');
    return user || {};
  }
  change() {
    return this.change$;
  }

  login(username: string, password: string, rememberMe = false) {
    return this.loginService.login(username, password, rememberMe).pipe(
      switchMap((response) => {
        const returnValue = JSON.parse(JSON.stringify(response))['token'];
        this.tokenService.set(returnValue);
        const roleData: [] = JSON.parse(JSON.stringify(response))['user'][
          'roles'
        ];
        roleData.sort((a: any, b: any) => {
          const aPri: number = a['priority'];
          const bPri: number = b['priority'];
          if (aPri > bPri) return 1;
          else if (aPri < bPri) return -1;
          else return 0;
        });
        this.tokenService.roleArray = roleData;
        this.tokenService.permissionArray = JSON.parse(
          JSON.stringify(response)
        )['user']['permissions'];

        this.user$.next(JSON.parse(JSON.stringify(response))['user']);
        this.store.set('currentUser', response.user);

        // Store role names in a new array
        const roleNames = this.tokenService.roleArray.map(
          (role: { name: string }) => role.name
        );

        const roleNamesJSON = JSON.stringify(roleNames);

        // Store the JSON string in LocalStorage
        this.store.set('roleNames', roleNamesJSON);

        return of(response); // Return the response to be handled in the component
      })
    );
  }

  logout() {
    // remove user from local storage to log user out
    this.store.clear();
    // this.currentUserSubject.next(this.currentUserValue);
    return of({ success: false });
  }

  assignUser(_user: BehaviorSubject<User>): Observable<User> {
    this.user$.next(this.currentUserValue); // Update the user$ BehaviorSubject with the new value
    return this.user$.asObservable(); // Return an observable that emits the new user value
  }
}
