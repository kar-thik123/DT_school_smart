import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Classes } from './classes.model';

@Injectable({
  providedIn: 'root',
})
export class ClassesService {
  private classes: Classes[] = [
    { id: 1, className: 'Class 1', section: 'A', academicYear: '2023-24', teacher: 'John Doe', status: 'Active', studentCount: '40', roomNumber: '101' },
    { id: 2, className: 'Class 2', section: 'B', academicYear: '2023-24', teacher: 'Jane Smith', status: 'Active', studentCount: '35', roomNumber: '102' },
    { id: 3, className: 'Class 3', section: 'A', academicYear: '2023-24', teacher: 'Alice Brown', status: 'Active', studentCount: '38', roomNumber: '103' },
    { id: 4, className: 'Class 4', section: 'C', academicYear: '2023-24', teacher: 'Bob White', status: 'Inactive', studentCount: '42', roomNumber: '104' },
    { id: 5, className: 'Class 5', section: 'B', academicYear: '2023-24', teacher: 'Charlie Green', status: 'Active', studentCount: '30', roomNumber: '105' },
    { id: 6, className: 'Class 6', section: 'A', academicYear: '2023-24', teacher: 'David Black', status: 'Active', studentCount: '36', roomNumber: '106' },
    { id: 7, className: 'Class 7', section: 'D', academicYear: '2023-24', teacher: 'Emma Watson', status: 'Active', studentCount: '39', roomNumber: '107' },
    { id: 8, className: 'Class 8', section: 'C', academicYear: '2023-24', teacher: 'Frank Miller', status: 'Active', studentCount: '41', roomNumber: '108' },
    { id: 9, className: 'Class 9', section: 'B', academicYear: '2023-24', teacher: 'Grace Hopper', status: 'Active', studentCount: '37', roomNumber: '109' },
    { id: 10, className: 'Class 10', section: 'A', academicYear: '2023-24', teacher: 'Henry Ford', status: 'Active', studentCount: '45', roomNumber: '110' },
    { id: 11, className: 'Class 11', section: 'B', academicYear: '2023-24', teacher: 'Isabel Bloom', status: 'Inactive', studentCount: '33', roomNumber: '111' },
    { id: 12, className: 'Class 12', section: 'C', academicYear: '2023-24', teacher: 'Jack Reacher', status: 'Active', studentCount: '34', roomNumber: '112' },
  ];

  dataChange: BehaviorSubject<Classes[]> = new BehaviorSubject<Classes[]>(
    []
  );

  getAllClasses(): Observable<Classes[]> {
    this.dataChange.next(this.classes);
    return of(this.classes);
  }

  addClass(classes: Classes): Observable<Classes> {
    classes.id = Math.max(...this.classes.map(c => c.id), 0) + 1;
    this.classes.push(classes);
    this.dataChange.next(this.classes);
    return of(classes);
  }

  updateClass(classes: Classes): Observable<Classes> {
    const index = this.classes.findIndex(c => c.id === classes.id);
    if (index !== -1) {
      this.classes[index] = classes;
      this.dataChange.next(this.classes);
    }
    return of(classes);
  }

  deleteClass(id: number): Observable<number> {
    this.classes = this.classes.filter(c => c.id !== id);
    this.dataChange.next(this.classes);
    return of(id);
  }
}
