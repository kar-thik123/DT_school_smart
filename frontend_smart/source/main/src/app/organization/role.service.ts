import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, Permission } from './role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/roles`;

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getAvailablePermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/available-permissions`);
  }

  getRolePermissions(roleId: string): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/${roleId}/permissions`);
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role);
  }

  syncPermissions(roleId: string, permissionIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${roleId}/sync-permissions`, { permissionIds });
  }

  deleteRole(roleId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${roleId}`);
  }
}
