import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { StudentHealthRecord } from './student-health-records.model';

@Injectable({
  providedIn: 'root',
})
export class StudentHealthRecordService {
  dataChange: BehaviorSubject<StudentHealthRecord[]> = new BehaviorSubject<
    StudentHealthRecord[]
  >([]);

  private staticData: StudentHealthRecord[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      student_name: 'John Doe',
      blood_group: 'A+',
      allergies: 'Peanuts',
      last_checkup: '2023-12-05',
      status: 'Fit',
      getRandomID: () => 1,
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Sarah Smith',
      blood_group: 'O-',
      allergies: 'None',
      last_checkup: '2023-11-20',
      status: 'Unfit',
      getRandomID: () => 2,
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      student_name: 'Michael Brown',
      blood_group: 'B+',
      allergies: 'Dust',
      last_checkup: '2023-10-15',
      status: 'Under Treatment',
      getRandomID: () => 3,
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      student_name: 'Emily Davis',
      blood_group: 'AB+',
      allergies: 'Lactose',
      last_checkup: '2023-09-10',
      status: 'Fit',
      getRandomID: () => 4,
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      student_name: 'David Wilson',
      blood_group: 'A-',
      allergies: 'None',
      last_checkup: '2023-08-25',
      status: 'Fit',
      getRandomID: () => 5,
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      student_name: 'Jessica Taylor',
      blood_group: 'B-',
      allergies: 'Pollen',
      last_checkup: '2023-07-15',
      status: 'Fit',
      getRandomID: () => 6,
    },
  ];

  /** GET: Fetch all student health records */
  getAllStudentHealthRecords(): Observable<StudentHealthRecord[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  /** POST: Add a new student health record */
  addStudentHealthRecord(
    studentHealthRecord: StudentHealthRecord
  ): Observable<StudentHealthRecord> {
    this.staticData.push(studentHealthRecord);
    this.dataChange.next(this.staticData);
    return of(studentHealthRecord);
  }

  /** PUT: Update an existing student health record */
  updateStudentHealthRecord(
    studentHealthRecord: StudentHealthRecord
  ): Observable<StudentHealthRecord> {
    const index = this.staticData.findIndex(
      (item) => item.id === studentHealthRecord.id
    );
    if (index !== -1) {
      this.staticData[index] = studentHealthRecord;
      this.dataChange.next(this.staticData);
    }
    return of(studentHealthRecord);
  }

  /** DELETE: Remove a student health record by ID */
  deleteStudentHealthRecord(id: number): Observable<number> {
    const index = this.staticData.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
