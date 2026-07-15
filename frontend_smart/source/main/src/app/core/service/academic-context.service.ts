import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'environments/environment';
import { tap, filter, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AcademicContextService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // Shared state observable for the active academic year
  private activeYearSubject = new BehaviorSubject<any>(null);
  
  // Expose observable, ignoring initial null to prevent subscription errors before load
  activeYear$ = this.activeYearSubject.asObservable().pipe(
    filter(y => y !== null)
  );

  constructor() {
    this.authService.user$.subscribe(user => {
      if (user && Object.keys(user).length > 0) {
        const isPlatformAdmin = this.authService.hasPermission('IDENTITY', 'IS_SYSTEM_ADMIN');
        if (!isPlatformAdmin) {
          console.log('[AcademicContextService] User session active. Loading active year context.');
          this.loadActiveYear().subscribe();
        } else {
          console.log('[AcademicContextService] Platform admin session active. Bypassing academic context.');
        }
      } else {
        console.log('[AcademicContextService] User session inactive. Clearing context.');
        this.clearContext();
      }
    });
  }

  /**
   * Fetches the centralized active academic year from the Master Configuration.
   * This is the single source of truth.
   */
  loadActiveYear(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/academic/active-year`).pipe(
      tap(year => {
        console.log('[AcademicContextService] Loaded active academic year:', year);
        this.activeYearSubject.next(year);
      }),
      catchError(err => {
        console.error('[AcademicContextService] Failed to load active year:', err);
        // Emit an empty object so subscribers don't hang indefinitely
        this.activeYearSubject.next({ id: '' });
        return of({ id: '' });
      })
    );
  }

  /**
   * Resets active year state on logout to prevent stale cross-tenant leakage.
   */
  clearContext(): void {
    this.activeYearSubject.next(null);
  }

  /**
   * Synchronously retrieves the current active academic year if loaded.
   */
  get currentActiveYear(): any {
    return this.activeYearSubject.value;
  }

  // --- Historical Dashboard Context ---
  private historicalYearSubject = new BehaviorSubject<any>(null);

  historicalYear$ = this.historicalYearSubject.asObservable().pipe(
    filter(y => y !== null)
  );

  setHistoricalYear(year: any): void {
    this.historicalYearSubject.next(year);
  }

  get currentHistoricalYear(): any {
    return this.historicalYearSubject.value;
  }
}
