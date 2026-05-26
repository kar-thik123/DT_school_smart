import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { RouteInfo } from './sidebar.metadata';
import { PLATFORM_MODULES } from './platform-module-registry';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  /**
   * Get platform-controlled RBAC module registry
   * @returns Observable<RouteInfo[]>
   */
  getRouteInfo(): Observable<RouteInfo[]> {
    return of(PLATFORM_MODULES);
  }
}
