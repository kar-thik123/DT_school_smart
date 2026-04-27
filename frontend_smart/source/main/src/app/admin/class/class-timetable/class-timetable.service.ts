import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClassTimetableService {
  private http = inject(HttpClient);

  private readonly API_URL = 'assets/data/class-timetable.json';
  getTimetable(): Observable<any> {
    return this.http.get(this.API_URL);
  }
}
