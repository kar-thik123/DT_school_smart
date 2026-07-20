import { AuthService } from '../service/auth.service';
import { Injectable, inject, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private injector = inject(Injector);

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        // 0 = Network error/offline, 504 = Gateway Timeout (often returned by Service Workers when offline)
        if (!navigator.onLine || err.status === 0 || err.status === 504 || err.status === 503) {
          const snackBar = this.injector.get(MatSnackBar);
          snackBar.open('No Internet Connection. Please check your network and try again.', 'Close', {
            duration: 5000,
            panelClass: ['snackbar-danger'],
            verticalPosition: 'bottom',
            horizontalPosition: 'center'
          });
          return EMPTY; // Stop the error from propagating to prevent generic 'Server Error' fallbacks
        } else if (err.status === 401) {
          // auto logout if 401 response returned from api
          const authenticationService = this.injector.get(AuthService);
          authenticationService.logout();
        }

        return throwError(() => err);
      })
    );
  }
}
