import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Announcement, IAnnouncement } from './announcement.model';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<Announcement[]> = new BehaviorSubject<
    Announcement[]
  >([]);

  // Static data with 12+ records
  private staticData: IAnnouncement[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      title: 'New Academic Year 2025 Commencement',
      announcementType: 'Academic',
      postedBy: 'Principal Office',
      startDate: '2025-01-01',
      endDate: '2025-01-15',
      status: 'Active',
      description:
        'Academic year 2025 will commence from January 6th, 2025. All students must report by 8:00 AM.',
      priority: 'High',
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      title: 'Republic Day Celebration',
      announcementType: 'Event',
      postedBy: 'Cultural Committee',
      startDate: '2025-01-20',
      endDate: '2025-01-26',
      status: 'Active',
      description:
        'Republic Day celebration on January 26th. Flag hoisting at 8:00 AM followed by cultural programs.',
      priority: 'High',
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      title: 'Textbook Distribution Schedule',
      announcementType: 'General',
      postedBy: 'Administration',
      startDate: '2025-01-02',
      endDate: '2025-01-10',
      status: 'Active',
      description:
        'Textbooks will be distributed class-wise from January 2nd to 10th during school hours.',
      priority: 'Medium',
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      title: 'Fire Safety Drill',
      announcementType: 'Urgent',
      postedBy: 'Safety Department',
      startDate: '2025-01-15',
      endDate: '2025-01-15',
      status: 'Active',
      description:
        'Mandatory fire safety drill on January 15th at 11:00 AM. All students and staff must participate.',
      priority: 'High',
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      title: 'Online Learning Platform Training',
      announcementType: 'Academic',
      postedBy: 'IT Department',
      startDate: '2025-01-08',
      endDate: '2025-01-12',
      status: 'Active',
      description:
        'Training sessions for new online learning platform. Teachers sessions: Jan 8-9, Students: Jan 11-12.',
      priority: 'Medium',
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      title: 'Annual Science Fair Registration',
      announcementType: 'Event',
      postedBy: 'Science Department',
      startDate: '2025-01-10',
      endDate: '2025-02-01',
      status: 'Active',
      description:
        'Register for Annual Science Fair 2025. Last date: February 1st. Contact science lab for details.',
      priority: 'Medium',
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      title: 'Parking Area Renovation',
      announcementType: 'General',
      postedBy: 'Facilities Management',
      startDate: '2025-01-20',
      endDate: '2025-01-31',
      status: 'Active',
      description:
        'Parking area under renovation from Jan 20-31. Use alternative parking near sports ground.',
      priority: 'Low',
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      title: 'Health Checkup Camp',
      announcementType: 'Event',
      postedBy: 'Health Services',
      startDate: '2025-01-25',
      endDate: '2025-01-27',
      status: 'Active',
      description:
        'Free health checkup camp for all students on Jan 25-27. Dental, Eye and General checkup available.',
      priority: 'Medium',
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      title: 'Alumni Meet 2025',
      announcementType: 'Event',
      postedBy: 'Alumni Relations',
      startDate: '2025-02-05',
      endDate: '2025-02-05',
      status: 'Active',
      description:
        'Annual Alumni Meet on February 5th. Register at alumni office. Cultural programs and dinner included.',
      priority: 'Low',
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      title: 'Exam Pattern Change Notice',
      announcementType: 'Urgent',
      postedBy: 'Examination Cell',
      startDate: '2025-01-05',
      endDate: '2025-01-20',
      status: 'Active',
      description:
        'Important: Exam pattern changed for semester exams. 30% internal, 70% external. Details on website.',
      priority: 'High',
    },
    {
      id: 11,
      img: 'assets/images/user/user11.jpg',
      title: 'Scholarship Application Open',
      announcementType: 'Academic',
      postedBy: 'Scholarship Committee',
      startDate: '2025-01-10',
      endDate: '2025-02-10',
      status: 'Active',
      description:
        'Merit and need-based scholarship applications open. Apply online before February 10th.',
      priority: 'Medium',
    },
    {
      id: 12,
      img: 'assets/images/user/user6.jpg',
      title: 'Campus WiFi Upgrade',
      announcementType: 'General',
      postedBy: 'IT Infrastructure',
      startDate: '2025-01-15',
      endDate: '2025-01-17',
      status: 'Active',
      description:
        'WiFi infrastructure upgrade on Jan 15-17. Service may be intermittent during working hours.',
      priority: 'Low',
    },
    {
      id: 13,
      img: 'assets/images/user/user1.jpg',
      title: 'COVID-19 Vaccination Drive',
      announcementType: 'Urgent',
      postedBy: 'Health Department',
      startDate: '2024-12-01',
      endDate: '2024-12-15',
      status: 'Expired',
      description:
        'COVID-19 booster dose vaccination drive completed successfully. Thank you for participation.',
      priority: 'High',
    },
  ];

  /** GET: Fetch all announcements */
  getAllAnnouncements(): Observable<Announcement[]> {
    return of(this.staticData as Announcement[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new announcement */
  addAnnouncement(announcement: Announcement): Observable<Announcement> {
    return of(announcement).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing announcement */
  updateAnnouncement(announcement: Announcement): Observable<Announcement> {
    return of(announcement).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove an announcement by ID */
  deleteAnnouncement(id: number): Observable<number> {
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
