import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AcademicContextService } from '../service/academic-context.service';

@Injectable()
export class AcademicContextInterceptor implements HttpInterceptor {
  private academicContextService = inject(AcademicContextService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const activeYear = this.academicContextService.currentActiveYear;
    const isHistoricalRoute = request.url.includes('/analytics') || request.url.includes('/reports');
    
    if (isHistoricalRoute && activeYear && activeYear.id) {
      request = request.clone({
        setHeaders: {
          'x-academic-year-id': activeYear.id
        }
      });
    }

    return next.handle(request);
  }
}
