import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { StudentPromotion } from './student-promotion.model';

@Injectable({
  providedIn: 'root',
})
export class StudentPromotionService {
  dataChange: BehaviorSubject<StudentPromotion[]> = new BehaviorSubject<
    StudentPromotion[]
  >([]);

  private staticData: StudentPromotion[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      student_name: 'John Doe',
      rollNo: '101',
      current_class: 'Grade 5',
      promoted_class: 'Grade 6',
      section: 'A',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 450,
      percentage: '90%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 1,
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Sarah Smith',
      rollNo: '102',
      current_class: 'Grade 5',
      promoted_class: 'Grade 6',
      section: 'B',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 420,
      percentage: '84%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 2,
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      student_name: 'Michael Brown',
      rollNo: '103',
      current_class: 'Grade 5',
      promoted_class: 'Grade 6',
      section: 'A',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 380,
      percentage: '76%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 3,
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      student_name: 'Emily Davis',
      rollNo: '104',
      current_class: 'Grade 4',
      promoted_class: 'Grade 5',
      section: 'C',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 470,
      percentage: '94%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 4,
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      student_name: 'David Wilson',
      rollNo: '105',
      current_class: 'Grade 4',
      promoted_class: 'Grade 5',
      section: 'B',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 310,
      percentage: '62%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 5,
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      student_name: 'Jessica Taylor',
      rollNo: '106',
      current_class: 'Grade 4',
      promoted_class: 'Grade 4',
      section: 'A',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 150,
      percentage: '30%',
      result: 'Fail',
      status: 'Detained',
      getRandomID: () => 6,
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      student_name: 'Kevin Anderson',
      rollNo: '107',
      current_class: 'Grade 3',
      promoted_class: 'Grade 4',
      section: 'B',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 400,
      percentage: '80%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 7,
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      student_name: 'Linda Martinez',
      rollNo: '108',
      current_class: 'Grade 3',
      promoted_class: 'Grade 4',
      section: 'C',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 430,
      percentage: '86%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 8,
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      student_name: 'Robert Thomas',
      rollNo: '109',
      current_class: 'Grade 3',
      promoted_class: 'Grade 4',
      section: 'A',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 390,
      percentage: '78%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 9,
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      student_name: 'Jennifer Lee',
      rollNo: '110',
      current_class: 'Grade 2',
      promoted_class: 'Grade 3',
      section: 'B',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 460,
      percentage: '92%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 10,
    },
    {
      id: 11,
      img: 'assets/images/user/user1.jpg',
      student_name: 'William Garcia',
      rollNo: '111',
      current_class: 'Grade 2',
      promoted_class: 'Grade 3',
      section: 'A',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 350,
      percentage: '70%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 11,
    },
    {
      id: 12,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Elizabeth Young',
      rollNo: '112',
      current_class: 'Grade 2',
      promoted_class: 'Grade 3',
      section: 'C',
      session: '2023-2024',
      promotion_date: '2024-06-15',
      total_marks: 500,
      obtained_marks: 410,
      percentage: '82%',
      result: 'Pass',
      status: 'Promoted',
      getRandomID: () => 12,
    },
  ];

  /** GET: Fetch all student promotions */
  getAllStudentPromotions(): Observable<StudentPromotion[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  /** POST: Add a new student promotion */
  addStudentPromotion(
    studentPromotion: StudentPromotion
  ): Observable<StudentPromotion> {
    return of(studentPromotion).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** PUT: Update an existing student promotion */
  updateStudentPromotion(
    studentPromotion: StudentPromotion
  ): Observable<StudentPromotion> {
    return of(studentPromotion).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /** DELETE: Remove a student promotion by ID */
  deleteStudentPromotion(id: number): Observable<number> {
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
