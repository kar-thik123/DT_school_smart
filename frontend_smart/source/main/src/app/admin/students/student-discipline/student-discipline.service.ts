import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { StudentDiscipline } from './student-discipline.model';

@Injectable({
  providedIn: 'root',
})
export class StudentDisciplineService {
  dataChange: BehaviorSubject<StudentDiscipline[]> = new BehaviorSubject<
    StudentDiscipline[]
  >([]);

  private staticData: StudentDiscipline[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      student_name: 'John Doe',
      incident_date: '2023-12-05',
      incident_type: 'Late Coming',
      incident_location: 'Main Gate',
      reported_by: 'Gatekeeper',
      action_taken: 'Warning',
      action_date: '2023-12-05',
      description: 'Arrived 15 minutes late',
      severity: 'Low',
      status: 'Resolved',
      getRandomID: () => 1,
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Sarah Smith',
      incident_date: '2023-11-20',
      incident_type: 'Bullying',
      incident_location: 'Playground',
      reported_by: 'Teacher Sarah',
      action_taken: 'Suspension',
      action_date: '2023-11-21',
      description: 'Verbal abuse to a junior',
      severity: 'High',
      status: 'Active',
      getRandomID: () => 2,
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      student_name: 'Michael Brown',
      incident_date: '2023-10-15',
      incident_type: 'Cheating',
      incident_location: 'Exam Hall',
      reported_by: 'Invigilator',
      action_taken: 'Exam Cancellation',
      action_date: '2023-10-16',
      description: 'Found with unauthorized materials',
      severity: 'High',
      status: 'Resolved',
      getRandomID: () => 3,
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      student_name: 'Emily Davis',
      incident_date: '2023-09-10',
      incident_type: 'Uniform Violation',
      incident_location: 'Classroom',
      reported_by: 'Class Teacher',
      action_taken: 'Fine',
      action_date: '2023-09-10',
      description: 'Not wearing proper shoes',
      severity: 'Low',
      status: 'Resolved',
      getRandomID: () => 4,
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      student_name: 'David Wilson',
      incident_date: '2023-08-25',
      incident_type: 'Damaging Property',
      incident_location: 'Lab',
      reported_by: 'Lab Assistant',
      action_taken: 'Repair Cost',
      action_date: '2023-08-26',
      description: 'Broke a test tube intentionally',
      severity: 'Medium',
      status: 'Pending',
      getRandomID: () => 5,
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      student_name: 'Jessica Taylor',
      incident_date: '2023-07-15',
      incident_type: 'Late Coming',
      incident_location: 'Main Gate',
      reported_by: 'Gatekeeper',
      action_taken: 'Parent Meeting',
      action_date: '2023-07-16',
      description: 'Repeated late arrival',
      severity: 'Medium',
      status: 'Resolved',
      getRandomID: () => 6,
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      student_name: 'Kevin Anderson',
      incident_date: '2023-06-20',
      incident_type: 'Insubordination',
      incident_location: 'Classroom',
      reported_by: 'Teacher Kevin',
      action_taken: 'Detention',
      action_date: '2023-06-21',
      description: 'Refused to follow instructions',
      severity: 'Medium',
      status: 'Resolved',
      getRandomID: () => 7,
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      student_name: 'Linda Martinez',
      incident_date: '2023-05-12',
      incident_type: 'Bunking Class',
      incident_location: 'Library',
      reported_by: 'Librarian',
      action_taken: 'Warning',
      action_date: '2023-05-13',
      description: 'Found in library during math class',
      severity: 'Low',
      status: 'Resolved',
      getRandomID: () => 8,
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      student_name: 'Robert Thomas',
      incident_date: '2023-04-18',
      incident_type: 'Bullying',
      incident_location: 'Canteen',
      reported_by: 'Canteen Staff',
      action_taken: 'Counseling',
      action_date: '2023-04-19',
      description: 'Physical altercation',
      severity: 'High',
      status: 'Active',
      getRandomID: () => 9,
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      student_name: 'Jennifer Lee',
      incident_date: '2023-03-25',
      incident_type: 'Uniform Violation',
      incident_location: 'Assembly',
      reported_by: 'Principal',
      action_taken: 'Warning',
      action_date: '2023-03-25',
      description: 'Improper uniform',
      severity: 'Low',
      status: 'Resolved',
      getRandomID: () => 10,
    },
    {
      id: 11,
      img: 'assets/images/user/user1.jpg',
      student_name: 'William Garcia',
      incident_date: '2023-02-10',
      incident_type: 'Late Coming',
      incident_location: 'Main Gate',
      reported_by: 'Gatekeeper',
      action_taken: 'Warning',
      action_date: '2023-02-10',
      description: 'Arrived 10 minutes late',
      severity: 'Low',
      status: 'Resolved',
      getRandomID: () => 11,
    },
    {
      id: 12,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Elizabeth Young',
      incident_date: '2023-01-15',
      incident_type: 'Cheating',
      incident_location: 'Classroom',
      reported_by: 'Teacher Elizabeth',
      action_taken: 'Parent Meeting',
      action_date: '2023-01-16',
      description: 'Copying homework',
      severity: 'Medium',
      status: 'Resolved',
      getRandomID: () => 12,
    },
  ];

  /** GET: Fetch all student discipline records */
  getAllStudentDisciplines(): Observable<StudentDiscipline[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  /** POST: Add a new student discipline record */
  addStudentDiscipline(
    studentDiscipline: StudentDiscipline
  ): Observable<StudentDiscipline> {
    return of(studentDiscipline).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing student discipline record */
  updateStudentDiscipline(
    studentDiscipline: StudentDiscipline
  ): Observable<StudentDiscipline> {
    return of(studentDiscipline).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove a student discipline record by ID */
  deleteStudentDiscipline(id: number): Observable<number> {
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
