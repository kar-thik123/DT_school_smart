import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface ICompletionSettings {
  /** Controls whether Completion Management module is active for this organization. */
  enable_module: boolean;
  /** Controls whether completion notifications are sent to students/parents. */
  enable_notifications: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/settings`;

  getCompletionSettings(): Observable<{ config_data: ICompletionSettings }> {
    return this.http.get<{ config_data: ICompletionSettings }>(`${this.API_URL}/completion`);
  }

  updateCompletionSettings(payload: ICompletionSettings): Observable<any> {
    return this.http.put(`${this.API_URL}/completion`, { config_data: payload });
  }
}
