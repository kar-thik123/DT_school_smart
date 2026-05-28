import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AcademicContextService } from '../service/academic-context.service';

@Injectable()
export class AcademicContextInterceptor implements HttpInterceptor {
  private academicContextService = inject(AcademicContextService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept requests to our API if needed, usually all HttpClient requests in the app go to the API
    // Ensure we don't inject on external auth or open requests if active year isn't set
    const activeYear = this.academicContextService.currentActiveYear;
    
    if (activeYear && activeYear.id) {
      request = request.clone({
        setHeaders: {
          'x-academic-year-id': activeYear.id
        }
      });
    }

    return next.handle(request);
  }
}
