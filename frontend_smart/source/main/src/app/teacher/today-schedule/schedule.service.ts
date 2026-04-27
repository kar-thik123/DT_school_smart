import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Schedule } from './schedule.model';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private httpClient = inject(HttpClient);

  private readonly mockData: Schedule[] = [
    { id: 1, subject: 'Mathematics', class: '10A', time: '08:00 AM', duration: '45 Min', room: '101', status: 'Completed' },
    { id: 2, subject: 'Physics', class: '11B', time: '09:00 AM', duration: '45 Min', room: '202', status: 'Completed' },
    { id: 3, subject: 'Chemistry', class: '12C', time: '10:00 AM', duration: '60 Min', room: 'Lab 1', status: 'Ongoing' },
    { id: 4, subject: 'Break', class: '-', time: '11:00 AM', duration: '15 Min', room: 'Cafe', status: 'Upcoming' },
    { id: 5, subject: 'Biology', class: '10B', time: '11:15 AM', duration: '45 Min', room: '103', status: 'Upcoming' },
    { id: 6, subject: 'English', class: '9A', time: '12:00 PM', duration: '45 Min', room: '105', status: 'Upcoming' },
    { id: 7, subject: 'Lunch', class: '-', time: '12:45 PM', duration: '45 Min', room: 'Canteen', status: 'Upcoming' },
    { id: 8, subject: 'History', class: '11A', time: '01:30 PM', duration: '45 Min', room: '201', status: 'Upcoming' },
    { id: 9, subject: 'Geography', class: '12B', time: '02:15 PM', duration: '45 Min', room: '203', status: 'Upcoming' },
    { id: 10, subject: 'PE', class: '9B', time: '03:00 PM', duration: '45 Min', room: 'Ground', status: 'Upcoming' },
    { id: 11, subject: 'Library', class: '10A', time: '03:45 PM', duration: '30 Min', room: 'Library', status: 'Upcoming' },
    { id: 12, subject: 'Staff Meeting', class: '-', time: '04:15 PM', duration: '30 Min', room: 'Hall', status: 'Upcoming' },
  ];

  getAllSchedules(): Observable<Schedule[]> {
    return of(this.mockData);
  }
  addSchedule(schedule: Schedule): Observable<Schedule> {
    this.mockData.unshift(schedule);
    return of(schedule);
  }

  updateSchedule(schedule: Schedule): Observable<Schedule> {
    const index = this.mockData.findIndex((it) => it.id === schedule.id);
    if (index !== -1) {
      this.mockData[index] = schedule;
    }
    return of(schedule);
  }

  deleteSchedule(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}
