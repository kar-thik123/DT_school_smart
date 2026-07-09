import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';

export interface TeacherDashboardContext {
  sectionId: string;
  subjectId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherDashboardContextService {
  private contextSubject = new BehaviorSubject<TeacherDashboardContext | null>(null);

  /** Emits the current section/subject context whenever it changes. Skips null. */
  context$: Observable<TeacherDashboardContext> = this.contextSubject.asObservable().pipe(
    filter((ctx): ctx is TeacherDashboardContext => ctx !== null),
    distinctUntilChanged((a, b) => a.sectionId === b.sectionId && a.subjectId === b.subjectId)
  );

  get currentContext(): TeacherDashboardContext | null {
    return this.contextSubject.value;
  }

  setContext(sectionId: string, subjectId?: string): void {
    this.contextSubject.next({ sectionId, subjectId });
  }
}
