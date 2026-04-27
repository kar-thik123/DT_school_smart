import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ClassStudent } from './class-student.model';

@Injectable({
  providedIn: 'root',
})
export class ClassStudentService {
  private httpClient = inject(HttpClient);

  private readonly mockData: ClassStudent[] = [
    { id: 1, rollNo: '101', name: 'John Doe', gender: 'Male', parentName: 'Robert Doe', mobile: '1234567890', email: 'john@example.com', address: '123 Street, City' },
    { id: 2, rollNo: '102', name: 'Jane Smith', gender: 'Female', parentName: 'Michael Smith', mobile: '9876543210', email: 'jane@example.com', address: '456 Avenue, City' },
    { id: 3, rollNo: '103', name: 'Alice Johnson', gender: 'Female', parentName: 'David Johnson', mobile: '5551234567', email: 'alice@example.com', address: '789 Lane, City' },
    { id: 4, rollNo: '104', name: 'Bob Brown', gender: 'Male', parentName: 'James Brown', mobile: '4441234567', email: 'bob@example.com', address: '321 Road, City' },
    { id: 5, rollNo: '105', name: 'Charlie Davis', gender: 'Male', parentName: 'William Davis', mobile: '3331234567', email: 'charlie@example.com', address: '654 Blvd, City' },
    { id: 6, rollNo: '106', name: 'Eva White', gender: 'Female', parentName: 'Richard White', mobile: '2221234567', email: 'eva@example.com', address: '987 Plaza, City' },
    { id: 7, rollNo: '107', name: 'Frank Black', gender: 'Male', parentName: 'Charles Black', mobile: '1111234567', email: 'frank@example.com', address: '123 Court, City' },
    { id: 8, rollNo: '108', name: 'Grace Miller', gender: 'Female', parentName: 'Thomas Miller', mobile: '6661234567', email: 'grace@example.com', address: '456 Way, City' },
    { id: 9, rollNo: '109', name: 'Henry Wilson', gender: 'Male', parentName: 'Joseph Wilson', mobile: '7771234567', email: 'henry@example.com', address: '789 Cir, City' },
    { id: 10, rollNo: '110', name: 'Isabella Taylor', gender: 'Female', parentName: 'Christopher Taylor', mobile: '8881234567', email: 'isabella@example.com', address: '321 Dr, City' },
    { id: 11, rollNo: '111', name: 'Jack Anderson', gender: 'Male', parentName: 'Daniel Anderson', mobile: '9991234567', email: 'jack@example.com', address: '654 Park, City' },
    { id: 12, rollNo: '112', name: 'Katherine Thomas', gender: 'Female', parentName: 'Matthew Thomas', mobile: '0001234567', email: 'katherine@example.com', address: '987 View, City' },
  ];

  getAllStudents(): Observable<ClassStudent[]> {
    return of(this.mockData);
  }

  addStudent(student: ClassStudent): Observable<ClassStudent> {
    this.mockData.unshift(student);
    return of(student);
  }

  updateStudent(student: ClassStudent): Observable<ClassStudent> {
    const index = this.mockData.findIndex((it) => it.id === student.id);
    if (index !== -1) {
      this.mockData[index] = student;
    }
    return of(student);
  }

  deleteStudent(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}

