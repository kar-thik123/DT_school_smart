import { Injectable } from '@angular/core';
import { Notice } from './notices.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NoticesService {
  private data: Notice[] = [
    { id: 1, title: 'Annual Sports Day', date: '2024-02-10', category: 'Sports', postedBy: 'Principal', details: 'The annual sports day will be held on Feb 10th.' },
    { id: 2, title: 'Mid-Term Exam Schedule', date: '2024-01-05', category: 'Academic', postedBy: 'Exam Cell', details: 'Check the mid-term exam schedule on the website.' },
    { id: 3, title: 'Holiday Notice', date: '2024-01-25', category: 'Holiday', postedBy: 'Admin', details: 'School will remain closed on Jan 26th for Republic Day.' },
    { id: 4, title: 'Science Fair', date: '2024-02-15', category: 'Event', postedBy: 'Science Dept', details: 'Students are invited to participate in the Science Fair.' },
    { id: 5, title: 'Parent-Teacher Meeting', date: '2024-02-05', category: 'Meeting', postedBy: 'Class Teacher', details: 'PTM for the second quarter will be held on Feb 5th.' },
    { id: 6, title: 'Library New Books', date: '2024-01-20', category: 'Library', postedBy: 'Librarian', details: 'New academic and fiction books are available now.' },
    { id: 7, title: 'Fee Payment Deadline', date: '2024-01-30', category: 'Finance', postedBy: 'Accounts', details: 'Last date for fee payment without fine is Jan 31st.' },
    { id: 8, title: 'Inter-School Debate', date: '2024-02-20', category: 'Competition', postedBy: 'Cultural Head', details: 'Selection for inter-school debate competition.' },
    { id: 9, title: 'Vaccination Camp', date: '2024-02-12', category: 'Health', postedBy: 'Medical Room', details: 'COVID-19 vaccination camp for students aged 12-18.' },
    { id: 10, title: 'Summer Camp Registration', date: '2024-03-01', category: 'Event', postedBy: 'Admin', details: 'Registration for summer camp starts from March 1st.' },
    { id: 11, title: 'Workshop on Cyber Security', date: '2024-02-18', category: 'Academic', postedBy: 'IT Dept', details: 'One day workshop on cyber security for seniors.' },
    { id: 12, title: 'School Magazine Submissions', date: '2024-02-25', category: 'Activity', postedBy: 'Editorial Board', details: 'Submit your articles for the annual magazine.' },
  ];

  getAllNotices(): Observable<Notice[]> {
    return of(this.data);
  }

  addNotice(notice: Notice): Observable<Notice> {
    notice.id = Math.max(...this.data.map((d) => d.id)) + 1;
    this.data.push(notice);
    return of(notice);
  }

  updateNotice(notice: Notice): Observable<Notice> {
    const index = this.data.findIndex((d) => d.id === notice.id);
    if (index !== -1) {
      this.data[index] = notice;
    }
    return of(notice);
  }

  deleteNotice(id: number): Observable<boolean> {
    this.data = this.data.filter((d) => d.id !== id);
    return of(true);
  }
}
