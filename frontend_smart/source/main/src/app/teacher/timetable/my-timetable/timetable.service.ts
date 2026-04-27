import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { TimetableEntry } from './timetable.model';

@Injectable({
  providedIn: 'root',
})
export class TimetableService {
  private httpClient = inject(HttpClient);

  private readonly mockData: TimetableEntry[] = [
    { id: 1, day: 'Monday', timeSlot: '08:00 AM - 09:00 AM', subject: 'Mathematics', class: '10A', room: '101' },
    { id: 2, day: 'Monday', timeSlot: '09:00 AM - 10:00 AM', subject: 'Physics', class: '11B', room: '202' },
    { id: 3, day: 'Tuesday', timeSlot: '10:00 AM - 11:00 AM', subject: 'Chemistry', class: '12C', room: 'Lab 1' },
    { id: 4, day: 'Tuesday', timeSlot: '11:15 AM - 12:15 PM', subject: 'Biology', class: '10B', room: '103' },
    { id: 5, day: 'Wednesday', timeSlot: '01:30 PM - 02:30 PM', subject: 'History', class: '11A', room: '201' },
    { id: 6, day: 'Wednesday', timeSlot: '02:30 PM - 03:30 PM', subject: 'Geography', class: '12B', room: '203' },
    { id: 7, day: 'Thursday', timeSlot: '08:00 AM - 09:00 AM', subject: 'Mathematics', class: '10A', room: '101' },
    { id: 8, day: 'Thursday', timeSlot: '09:00 AM - 10:00 AM', subject: 'English', class: '9A', room: '105' },
    { id: 9, day: 'Friday', timeSlot: '10:00 AM - 11:00 AM', subject: 'Physics', class: '11B', room: '202' },
    { id: 10, day: 'Friday', timeSlot: '11:15 AM - 12:15 PM', subject: 'Chemistry', class: '12C', room: 'Lab 1' },
    { id: 11, day: 'Saturday', timeSlot: '08:00 AM - 09:00 AM', subject: 'Staff Meeting', class: '-', room: 'Hall' },
    { id: 12, day: 'Saturday', timeSlot: '09:00 AM - 10:00 AM', subject: 'Extra Class', class: '12C', room: '101' },
  ];

  getTimetable(): Observable<TimetableEntry[]> {
    return of(this.mockData);
  }

  addTimetable(timetable: TimetableEntry): Observable<TimetableEntry> {
    this.mockData.unshift(timetable);
    return of(timetable);
  }

  updateTimetable(timetable: TimetableEntry): Observable<TimetableEntry> {
    const index = this.mockData.findIndex((it) => it.id === timetable.id);
    if (index !== -1) {
      this.mockData[index] = timetable;
    }
    return of(timetable);
  }

  deleteTimetable(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}

