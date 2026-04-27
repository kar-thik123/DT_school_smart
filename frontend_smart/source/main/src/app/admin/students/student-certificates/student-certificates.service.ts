import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { StudentCertificate } from './student-certificates.model';

@Injectable({
  providedIn: 'root',
})
export class StudentCertificateService {
  dataChange: BehaviorSubject<StudentCertificate[]> = new BehaviorSubject<
    StudentCertificate[]
  >([]);

  private staticData: StudentCertificate[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      student_name: 'John Doe',
      certificate_type: 'Merit Certificate',
      certificate_no: 'CERT-001',
      issued_by: 'Principal',
      issue_date: '2023-12-01',
      expiry_date: '2025-01-20',
      category: 'Academic',
      description: 'Academic excellence in Mathematics',
      status: 'Active',
      getRandomID: () => 1,
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Sarah Smith',
      certificate_type: 'Sports Certificate',
      certificate_no: 'CERT-002',
      issued_by: 'Sports Coach',
      issue_date: '2023-11-15',
      expiry_date: '2025-01-20',
      category: 'Sports',
      description: 'First place in 100m sprint',
      status: 'Active',
      getRandomID: () => 2,
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      student_name: 'Michael Brown',
      certificate_type: 'Participation',
      certificate_no: 'CERT-003',
      issued_by: 'Event Coordinator',
      issue_date: '2023-10-20',
      expiry_date: '2025-01-20',
      category: 'Extra-curricular',
      description: 'Annual Science Fair',
      status: 'Active',
      getRandomID: () => 3,
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      student_name: 'Emily Davis',
      certificate_type: 'Transfer Certificate',
      certificate_no: 'TC-2023-01',
      issued_by: 'Registrar',
      issue_date: '2023-09-05',
      expiry_date: '2025-01-20',
      category: 'Administrative',
      description: 'Transfer to another school',
      status: 'Closed',
      getRandomID: () => 4,
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      student_name: 'David Wilson',
      certificate_type: 'Conduct Certificate',
      certificate_no: 'CERT-004',
      issued_by: 'Class Teacher',
      issue_date: '2023-08-12',
      expiry_date: '2025-01-20',
      category: 'General',
      description: 'Exemplary behavior',
      status: 'Active',
      getRandomID: () => 5,
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      student_name: 'Jessica Taylor',
      certificate_type: 'Merit Certificate',
      certificate_no: 'CERT-005',
      issued_by: 'Principal',
      issue_date: '2023-07-20',
      expiry_date: '2025-01-20',
      category: 'Academic',
      description: 'Top performer in Science',
      status: 'Active',
      getRandomID: () => 6,
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      student_name: 'Kevin Anderson',
      certificate_type: 'Sports Certificate',
      certificate_no: 'CERT-006',
      issued_by: 'Sports Coach',
      issue_date: '2023-06-15',
      expiry_date: '2025-01-20',
      category: 'Sports',
      description: 'Captain of Football Team',
      status: 'Active',
      getRandomID: () => 7,
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      student_name: 'Linda Martinez',
      certificate_type: 'Participation',
      certificate_no: 'CERT-007',
      issued_by: 'Music Teacher',
      issue_date: '2023-05-10',
      expiry_date: '2025-01-20',
      category: 'Extra-curricular',
      description: 'Inter-school Music Competition',
      status: 'Active',
      getRandomID: () => 8,
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      student_name: 'Robert Thomas',
      certificate_type: 'Course Completion',
      certificate_no: 'CERT-008',
      issued_by: 'IT Dept',
      issue_date: '2023-04-25',
      expiry_date: '2024-04-25',
      category: 'Skill Development',
      description: 'Basic Computer Skills',
      status: 'Active',
      getRandomID: () => 9,
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      student_name: 'Jennifer Lee',
      certificate_type: 'Attendance Award',
      certificate_no: 'CERT-009',
      issued_by: 'Principal',
      issue_date: '2023-03-30',
      expiry_date: '2025-01-20',
      category: 'General',
      description: '100% Attendance for Q1',
      status: 'Active',
      getRandomID: () => 10,
    },
    {
      id: 11,
      img: 'assets/images/user/user1.jpg',
      student_name: 'William Garcia',
      certificate_type: 'Art Excellence',
      certificate_no: 'CERT-010',
      issued_by: 'Art Teacher',
      issue_date: '2023-02-14',
      expiry_date: '2025-01-20',
      category: 'Extra-curricular',
      description: 'First place in Art Competition',
      status: 'Active',
      getRandomID: () => 11,
    },
    {
      id: 12,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Elizabeth Young',
      certificate_type: 'Community Service',
      certificate_no: 'CERT-011',
      issued_by: 'Social Work Dept',
      issue_date: '2023-01-20',
      expiry_date: '2025-01-20',
      category: 'General',
      description: 'Volunteer for Blood Donation Camp',
      status: 'Active',
      getRandomID: () => 12,
    },
  ];

  /** GET: Fetch all student certificates */
  getAllStudentCertificates(): Observable<StudentCertificate[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  /** POST: Add a new student certificate */
  addStudentCertificate(
    studentCertificate: StudentCertificate
  ): Observable<StudentCertificate> {
    return of(studentCertificate).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing student certificate */
  updateStudentCertificate(
    studentCertificate: StudentCertificate
  ): Observable<StudentCertificate> {
    return of(studentCertificate).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove a student certificate by ID */
  deleteStudentCertificate(id: number): Observable<number> {
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
