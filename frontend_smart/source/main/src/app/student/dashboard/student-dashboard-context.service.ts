import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StudentOverview } from './dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class StudentDashboardContextService {
  private overviewSubject = new BehaviorSubject<StudentOverview | null>(null);

  /** Emits the current student overview context whenever it changes. Skips null. */
  overview$: Observable<StudentOverview> = this.overviewSubject.asObservable().pipe(
    filter((ctx): ctx is StudentOverview => ctx !== null)
  );

  get currentOverview(): StudentOverview | null {
    return this.overviewSubject.value;
  }

  setOverview(overview: StudentOverview): void {
    this.overviewSubject.next(overview);
  }
}
