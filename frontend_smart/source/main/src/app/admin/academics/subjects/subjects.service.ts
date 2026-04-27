import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Subjects } from './subjects.model';

@Injectable({
  providedIn: 'root',
})
export class SubjectsService {
  private subjects: Subjects[] = [
    { id: 1, subjectName: 'Mathematics', subjectCode: 'MATH101', subjectType: 'Core', status: 'Active', prerequisites: 'None', credits: '4' },
    { id: 2, subjectName: 'Science', subjectCode: 'SCI101', subjectType: 'Core', status: 'Active', prerequisites: 'None', credits: '4' },
    { id: 3, subjectName: 'English', subjectCode: 'ENG101', subjectType: 'Core', status: 'Active', prerequisites: 'None', credits: '3' },
    { id: 4, subjectName: 'History', subjectCode: 'HIS101', subjectType: 'Elective', status: 'Active', prerequisites: 'None', credits: '3' },
    { id: 5, subjectName: 'Geography', subjectCode: 'GEO101', subjectType: 'Elective', status: 'Active', prerequisites: 'None', credits: '3' },
    { id: 6, subjectName: 'Physics', subjectCode: 'PHY101', subjectType: 'Core', status: 'Active', prerequisites: 'Science', credits: '4' },
    { id: 7, subjectName: 'Chemistry', subjectCode: 'CHE101', subjectType: 'Core', status: 'Active', prerequisites: 'Science', credits: '4' },
    { id: 8, subjectName: 'Biology', subjectCode: 'BIO101', subjectType: 'Core', status: 'Active', prerequisites: 'Science', credits: '4' },
    { id: 9, subjectName: 'Computer Science', subjectCode: 'CS101', subjectType: 'Elective', status: 'Active', prerequisites: 'None', credits: '3' },
    { id: 10, subjectName: 'Economics', subjectCode: 'ECO101', subjectType: 'Elective', status: 'Active', prerequisites: 'None', credits: '3' },
    { id: 11, subjectName: 'Psychology', subjectCode: 'PSY101', subjectType: 'Elective', status: 'Active', prerequisites: 'None', credits: '3' },
    { id: 12, subjectName: 'Political Science', subjectCode: 'POL101', subjectType: 'Elective', status: 'Active', prerequisites: 'None', credits: '3' },
  ];

  dataChange: BehaviorSubject<Subjects[]> = new BehaviorSubject<Subjects[]>(
    []
  );

  getAllSubjects(): Observable<Subjects[]> {
    this.dataChange.next(this.subjects);
    return of(this.subjects);
  }

  addSubject(subjects: Subjects): Observable<Subjects> {
    subjects.id = Math.max(...this.subjects.map(s => s.id), 0) + 1;
    this.subjects.push(subjects);
    this.dataChange.next(this.subjects);
    return of(subjects);
  }

  updateSubject(subjects: Subjects): Observable<Subjects> {
    const index = this.subjects.findIndex(s => s.id === subjects.id);
    if (index !== -1) {
      this.subjects[index] = subjects;
      this.dataChange.next(this.subjects);
    }
    return of(subjects);
  }

  deleteSubject(id: number): Observable<number> {
    this.subjects = this.subjects.filter(s => s.id !== id);
    this.dataChange.next(this.subjects);
    return of(id);
  }
}
