import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Announcement } from './announcement.model';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private httpClient = inject(HttpClient);

  private readonly mockData: Announcement[] = [
    { id: 1, title: 'Exam Guidelines 2025', date: '2025-12-25', target: 'All Students', description: 'Guidelines for upcoming exams' },
    { id: 2, title: 'Class 10A Field Trip', date: '2025-12-24', target: '10A', description: 'Permission slips required' },
    { id: 3, title: 'Library New Books Addition', date: '2025-12-23', target: 'All Students', description: 'New collection available' },
    { id: 4, title: 'Holiday Assignment', date: '2025-12-22', target: '11B', description: 'Chemistry project details' },
    { id: 5, title: 'Sports House Selection', date: '2025-12-21', target: 'All Students', description: 'Trial on Monday' },
    { id: 6, title: 'Music Fest Auditions', date: '2025-12-20', target: 'All Students', description: 'In the auditorium' },
    { id: 7, title: 'Class 12C Special Class', date: '2025-12-19', target: '12C', description: 'Saturday 10 AM' },
    { id: 8, title: 'Science Fair Winners', date: '2025-12-18', target: 'All Students', description: 'Congratulations to all' },
    { id: 9, title: 'Internal Assessment Dates', date: '2025-12-17', target: 'All Students', description: 'Schedule updated' },
    { id: 10, title: 'Canteen Menu Update', date: '2025-12-16', target: 'All Students', description: 'New prices' },
    { id: 11, title: 'Yoga Day Session', date: '2025-12-15', target: 'All Students', description: 'Wear comfortable clothes' },
    { id: 12, title: 'Debate Club Meeting', date: '2025-12-14', target: 'All Students', description: 'Topic: Climate Change' },
  ];

  getAllAnnouncements(): Observable<Announcement[]> {
    return of(this.mockData);
  }

  addAnnouncement(announcement: Announcement): Observable<Announcement> {
    this.mockData.unshift(announcement);
    return of(announcement);
  }

  updateAnnouncement(announcement: Announcement): Observable<Announcement> {
    const index = this.mockData.findIndex((it) => it.id === announcement.id);
    if (index !== -1) {
      this.mockData[index] = announcement;
    }
    return of(announcement);
  }

  deleteAnnouncement(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}


