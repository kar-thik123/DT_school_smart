import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AcademicContextService } from '../service/academic-context.service';

@Injectable()
export class AcademicContextInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Lazily resolve service to break circular injection dependency with HttpClient
    const academicContextService = this.injector.get(AcademicContextService);
    const activeYear = academicContextService.currentHistoricalYear || academicContextService.currentActiveYear;
    const isHistoricalRoute = request.url.includes('/analytics') || 
                              request.url.includes('/reports') || 
                              request.url.includes('/academic/grades') ||
                              request.url.includes('/examinations') ||
                              request.url.includes('/student-exam-results');
    
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
