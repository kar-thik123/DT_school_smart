import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AcademicCalendar } from './academic-calendar.model';

@Injectable({
  providedIn: 'root',
})
export class AcademicCalendarService {
  private readonly data: AcademicCalendar[] = [
    { id: 1, eventTitle: 'New Academic Session Starts', startDate: '2025-06-01', endDate: '2025-06-01', category: 'Academic', description: 'Beginning of the new academic year.' },
    { id: 2, eventTitle: 'Summer Vacation', startDate: '2025-05-01', endDate: '2025-05-31', category: 'Holiday', description: 'Annual summer break for all students.' },
    { id: 3, eventTitle: 'First Term Exams', startDate: '2025-09-15', endDate: '2025-09-30', category: 'Examination', description: 'Mid-term examinations for all grades.' },
    { id: 4, eventTitle: 'Annual Sports Meet', startDate: '2025-11-10', endDate: '2025-11-12', category: 'Event', description: 'Inter-house sports competitions.' },
    { id: 5, eventTitle: 'Winter Break', startDate: '2025-12-24', endDate: '2026-01-02', category: 'Holiday', description: 'Christmas and New Year holidays.' },
    { id: 6, eventTitle: 'Annual Science Fair', startDate: '2026-02-15', endDate: '2026-02-15', category: 'Event', description: 'Showcase of student science projects.' },
    { id: 7, eventTitle: 'Second Term Exams', startDate: '2026-03-10', endDate: '2026-03-25', category: 'Examination', description: 'Final term examinations.' },
    { id: 8, eventTitle: 'Parent-Teacher Meeting', startDate: '2025-08-05', endDate: '2025-08-05', category: 'Academic', description: 'Discussion on student progress.' },
    { id: 9, eventTitle: 'Independence Day Celebration', startDate: '2025-08-15', endDate: '2025-08-15', category: 'Holiday', description: 'National holiday celebration.' },
    { id: 10, eventTitle: 'Teacher\'s Day', startDate: '2025-09-05', endDate: '2025-09-05', category: 'Event', description: 'Special assembly for teachers.' },
    { id: 11, eventTitle: 'Educational Field Trip', startDate: '2025-10-20', endDate: '2025-10-20', category: 'Academic', description: 'Visit to the national museum.' },
    { id: 12, eventTitle: 'Annual Day', startDate: '2025-12-15', endDate: '2025-12-15', category: 'Event', description: 'Cultural program and prize distribution.' },
  ];

  dataChange: BehaviorSubject<AcademicCalendar[]> = new BehaviorSubject<AcademicCalendar[]>([]);

  constructor() {}

  get dataItems(): AcademicCalendar[] {
    return this.dataChange.value;
  }

  getAllEvents(): Observable<AcademicCalendar[]> {
    return of(this.data);
  }

  addEvent(event: AcademicCalendar): void {
    this.data.unshift(event);
  }

  updateEvent(event: AcademicCalendar): void {
    const index = this.data.findIndex((it) => it.id === event.id);
    if (index !== -1) {
      this.data[index] = event;
    }
  }

  deleteEvent(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
