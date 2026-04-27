import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Session } from './sessions.model';

@Injectable({
  providedIn: 'root',
})
export class SessionsService {
  private sessions: Session[] = [
    { id: 1, sessionName: 'Session 1', startDate: '2023-06-01', endDate: '2023-10-31', status: 'Active', instructor: 'John Doe', room: '101' },
    { id: 2, sessionName: 'Session 2', startDate: '2023-11-01', endDate: '2024-03-31', status: 'Active', instructor: 'Jane Smith', room: '102' },
    { id: 3, sessionName: 'Session 3', startDate: '2024-04-01', endDate: '2024-05-31', status: 'Active', instructor: 'Alice Brown', room: '103' },
    { id: 4, sessionName: 'Session 4', startDate: '2022-06-01', endDate: '2022-10-31', status: 'Inactive', instructor: 'Bob White', room: '104' },
    { id: 5, sessionName: 'Session 5', startDate: '2022-11-01', endDate: '2023-03-31', status: 'Inactive', instructor: 'Charlie Green', room: '105' },
    { id: 6, sessionName: 'Session 6', startDate: '2023-04-01', endDate: '2023-05-31', status: 'Inactive', instructor: 'David Black', room: '106' },
    { id: 7, sessionName: 'Session 7', startDate: '2021-06-01', endDate: '2021-10-31', status: 'Inactive', instructor: 'Emma Watson', room: '107' },
    { id: 8, sessionName: 'Session 8', startDate: '2021-11-01', endDate: '2022-03-31', status: 'Inactive', instructor: 'Frank Miller', room: '108' },
    { id: 9, sessionName: 'Session 9', startDate: '2022-04-01', endDate: '2022-05-31', status: 'Inactive', instructor: 'Grace Hopper', room: '109' },
    { id: 10, sessionName: 'Session 10', startDate: '2020-06-01', endDate: '2020-10-31', status: 'Inactive', instructor: 'Henry Ford', room: '110' },
    { id: 11, sessionName: 'Session 11', startDate: '2020-11-01', endDate: '2021-03-31', status: 'Inactive', instructor: 'Isabel Bloom', room: '111' },
    { id: 12, sessionName: 'Session 12', startDate: '2021-04-01', endDate: '2021-05-31', status: 'Inactive', instructor: 'Jack Reacher', room: '112' },
  ];

  dataChange: BehaviorSubject<Session[]> = new BehaviorSubject<Session[]>(
    []
  );

  getAllSessions(): Observable<Session[]> {
    this.dataChange.next(this.sessions);
    return of(this.sessions);
  }

  addSession(session: Session): Observable<Session> {
    session.id = Math.max(...this.sessions.map(s => s.id), 0) + 1;
    this.sessions.push(session);
    this.dataChange.next(this.sessions);
    return of(session);
  }

  updateSession(session: Session): Observable<Session> {
    const index = this.sessions.findIndex(s => s.id === session.id);
    if (index !== -1) {
      this.sessions[index] = session;
      this.dataChange.next(this.sessions);
    }
    return of(session);
  }

  deleteSession(id: number): Observable<number> {
    this.sessions = this.sessions.filter(s => s.id !== id);
    this.dataChange.next(this.sessions);
    return of(id);
  }
}
