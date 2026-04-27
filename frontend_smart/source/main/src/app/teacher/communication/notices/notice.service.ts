import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Notice } from './notice.model';

@Injectable({
  providedIn: 'root',
})
export class NoticeService {
  private httpClient = inject(HttpClient);

  private readonly mockData: Notice[] = [
    { id: 1, title: 'Annual Sports Day', date: '2025-12-26', category: 'Information', details: 'Details about sports day' },
    { id: 2, title: 'Internal Exam Schedule', date: '2025-12-25', category: 'Academic', details: 'Exams starting from next week' },
    { id: 3, title: 'New Leave Policy', date: '2025-12-24', category: 'Urgent', details: 'Important update for teachers' },
    { id: 4, title: 'Winter Vacation', date: '2025-12-23', category: 'Information', details: 'School closed from Jan 1' },
    { id: 5, title: 'Library Renovation', date: '2025-12-22', category: 'Information', details: 'Library closed for 3 days' },
    { id: 6, title: 'Staff Meeting', date: '2025-12-21', category: 'Academic', details: 'Mandatory for all staff' },
    { id: 7, title: 'Parent-Teacher Meeting', date: '2025-12-20', category: 'Academic', details: 'Discussion on student progress' },
    { id: 8, title: 'COVID-19 Guidelines', date: '2025-12-19', category: 'Urgent', details: 'Mandatory masks' },
    { id: 9, title: 'New Curriculum Update', date: '2025-12-18', category: 'Academic', details: 'Changes in syllabus' },
    { id: 10, title: 'School Building Painting', date: '2025-12-17', category: 'Information', details: 'Avoid block A' },
    { id: 11, title: 'Teacher Training Workshop', date: '2025-12-16', category: 'Academic', details: 'Focus on digital tools' },
    { id: 12, title: 'Founders Day Celebration', date: '2025-12-15', category: 'Information', details: 'Schedule for the day' },
  ];

  getAllNotices(): Observable<Notice[]> {
    return of(this.mockData);
  }

  addNotice(notice: Notice): Observable<Notice> {
    this.mockData.unshift(notice);
    return of(notice);
  }

  updateNotice(notice: Notice): Observable<Notice> {
    const index = this.mockData.findIndex((it) => it.id === notice.id);
    if (index !== -1) {
      this.mockData[index] = notice;
    }
    return of(notice);
  }

  deleteNotice(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}


