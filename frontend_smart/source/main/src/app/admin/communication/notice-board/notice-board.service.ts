import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { NoticeBoard, INoticeBoard } from './notice-board.model';

@Injectable({
  providedIn: 'root',
})
export class NoticeBoardService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<NoticeBoard[]> = new BehaviorSubject<
    NoticeBoard[]
  >([]);

  // Static data with 12+ records
  private staticData: INoticeBoard[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      title: 'Annual Sports Day Announcement',
      postedBy: 'John Smith',
      department: 'Sports',
      date: '2024-12-20',
      priority: 'High',
      status: 'Active',
      description:
        'Annual sports day will be held on January 15th, 2025. All students are requested to participate.',
      targetAudience: 'All Students',
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      title: 'Parent-Teacher Meeting',
      postedBy: 'Sarah Johnson',
      department: 'Administration',
      date: '2024-12-19',
      priority: 'High',
      status: 'Active',
      description:
        'PTM scheduled for December 30th. Parents are requested to meet respective class teachers.',
      targetAudience: 'Parents',
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      title: 'Winter Break Schedule',
      postedBy: 'Michael Brown',
      department: 'Administration',
      date: '2024-12-18',
      priority: 'Medium',
      status: 'Active',
      description:
        'Winter break from December 24th to January 5th. School will reopen on January 6th.',
      targetAudience: 'All',
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      title: 'Science Exhibition',
      postedBy: 'Emily Davis',
      department: 'Science',
      date: '2024-12-17',
      priority: 'Medium',
      status: 'Active',
      description:
        'Inter-school science exhibition on January 20th. Students interested in participating should register.',
      targetAudience: 'All Students',
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      title: 'Library New Books Arrival',
      postedBy: 'David Wilson',
      department: 'Library',
      date: '2024-12-16',
      priority: 'Low',
      status: 'Active',
      description:
        'New collection of books added to library. Students can issue them from December 20th.',
      targetAudience: 'All Students',
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      title: 'Fee Payment Reminder',
      postedBy: 'Lisa Anderson',
      department: 'Accounts',
      date: '2024-12-15',
      priority: 'High',
      status: 'Active',
      description:
        'Last date for fee payment is December 31st. Late fee will be charged after the deadline.',
      targetAudience: 'All Students',
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      title: 'Career Counseling Session',
      postedBy: 'Robert Martinez',
      department: 'Counseling',
      date: '2024-12-14',
      priority: 'Medium',
      status: 'Active',
      description:
        'Career counseling session for Grade 10-12 students on December 28th.',
      targetAudience: 'Senior Students',
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      title: 'COVID-19 Safety Guidelines',
      postedBy: 'Jennifer Taylor',
      department: 'Health',
      date: '2024-12-13',
      priority: 'High',
      status: 'Archived',
      description:
        'Updated COVID-19 safety guidelines. Masks are optional but hand sanitization is mandatory.',
      targetAudience: 'All',
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      title: 'Music Competition Registration',
      postedBy: 'William Thomas',
      department: 'Music',
      date: '2024-12-12',
      priority: 'Low',
      status: 'Active',
      description:
        'Inter-house music competition registration open till December 25th.',
      targetAudience: 'All Students',
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      title: 'Transportation Route Change',
      postedBy: 'Amanda White',
      department: 'Transport',
      date: '2024-12-11',
      priority: 'High',
      status: 'Active',
      description:
        'Route 5 timing changed from 7:30 AM to 7:00 AM effective from December 23rd.',
      targetAudience: 'Transport Users',
    },
    {
      id: 11,
      img: 'assets/images/user/user11.jpg',
      title: 'Art Workshop Registration',
      postedBy: 'Christopher Harris',
      department: 'Arts',
      date: '2024-12-10',
      priority: 'Medium',
      status: 'Active',
      description:
        'Weekend art workshop for beginners. Registration closes on December 27th.',
      targetAudience: 'All Students',
    },
    {
      id: 12,
      img: 'assets/images/user/user6.jpg',
      title: 'Disciplinary Code Update',
      postedBy: 'Jessica Clark',
      department: 'Discipline',
      date: '2024-12-09',
      priority: 'High',
      status: 'Active',
      description:
        'Updated school disciplinary code effective from next academic year.',
      targetAudience: 'All',
    },
    {
      id: 13,
      img: 'assets/images/user/user1.jpg',
      title: 'Campus Maintenance Notice',
      postedBy: 'Matthew Lewis',
      department: 'Facilities',
      date: '2024-12-08',
      priority: 'Low',
      status: 'Active',
      description:
        'Building B under maintenance from December 26-28. Classes shifted temporarily.',
      targetAudience: 'All',
    },
  ];

  /** GET: Fetch all notice boards */
  getAllNoticeBoards(): Observable<NoticeBoard[]> {
    return of(this.staticData as NoticeBoard[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new notice board */
  addNoticeBoard(noticeBoard: NoticeBoard): Observable<NoticeBoard> {
    return of(noticeBoard).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing notice board */
  updateNoticeBoard(noticeBoard: NoticeBoard): Observable<NoticeBoard> {
    return of(noticeBoard).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove a notice board by ID */
  deleteNoticeBoard(id: number): Observable<number> {
    return of(id).pipe(
      map((_response) => {
        return id;
      }),
      catchError(this.handleError)
    );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
