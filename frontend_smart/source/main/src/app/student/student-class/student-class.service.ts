import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ClassModel } from './student-class.model';

@Injectable({
  providedIn: 'root'
})
export class StudentClassService {

  private classes: ClassModel[] = [
    {
      id: '1',
      className: 'Grade 10 - A',
      subjects: ['Math', 'Physics', 'Chemistry'],
      teachers: ['Mr. Smith', 'Ms. Jones'],
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '09:00 AM - 10:00 AM'
      }
    },
    {
      id: '2',
      className: 'Grade 10 - B',
      subjects: ['Biology', 'English', 'History'],
      teachers: ['Ms. Davis', 'Mr. Brown'],
      schedule: {
        days: ['Tuesday', 'Thursday'],
        time: '10:30 AM - 11:30 AM'
      }
    },
    {
      id: '3',
      className: 'Grade 11 - C',
      subjects: ['Advanced Math', 'Computer Science'],
      teachers: ['Dr. White'],
      schedule: {
        days: ['Monday', 'Wednesday'],
        time: '01:00 PM - 02:30 PM'
      }
    }
  ];

  constructor() { }

  getEnrolledClasses(): Observable<ClassModel[]> {
    // Simulate API call with a delay
    return of(this.classes).pipe(
      delay(500) // Simulate network latency
    );
  }

  // Example of error handling (optional)
  getEnrolledClassesWithError(): Observable<ClassModel[]> {
    return throwError(() => new Error('Failed to fetch classes.'));
  }
}