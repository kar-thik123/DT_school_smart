import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Syllabus } from './syllabus.model';

@Injectable({
  providedIn: 'root',
})
export class SyllabusService {
  private readonly data: Syllabus[] = [
    { id: 1, subject: 'Mathematics', class: 'Grade 10', title: 'Calculus & Algebra', type: 'PDF', date: '2025-12-01', downloadUrl: '#' },
    { id: 2, subject: 'Physics', class: 'Grade 10', title: 'Thermodynamics', type: 'DOC', date: '2025-12-02', downloadUrl: '#' },
    { id: 3, subject: 'Chemistry', class: 'Grade 10', title: 'Organic Chemistry', type: 'PDF', date: '2025-12-03', downloadUrl: '#' },
    { id: 4, subject: 'Biology', class: 'Grade 10', title: 'Genetics', type: 'PPT', date: '2025-12-04', downloadUrl: '#' },
    { id: 5, subject: 'English', class: 'Grade 10', title: 'Modern Literature', type: 'PDF', date: '2025-12-05', downloadUrl: '#' },
    { id: 6, subject: 'History', class: 'Grade 10', title: 'World War II', type: 'PDF', date: '2025-12-06', downloadUrl: '#' },
    { id: 7, subject: 'Geography', class: 'Grade 10', title: 'Climate Patterns', type: 'DOC', date: '2025-12-07', downloadUrl: '#' },
    { id: 8, subject: 'Computer Science', class: 'Grade 10', title: 'Data Structures', type: 'PDF', date: '2025-12-08', downloadUrl: '#' },
    { id: 9, subject: 'Economics', class: 'Grade 10', title: 'Macroeconomics', type: 'PPT', date: '2025-12-09', downloadUrl: '#' },
    { id: 10, subject: 'Political Science', class: 'Grade 10', title: 'Global Politics', type: 'PDF', date: '2025-12-10', downloadUrl: '#' },
    { id: 11, subject: 'Art', class: 'Grade 10', title: 'History of Art', type: 'PDF', date: '2025-12-11', downloadUrl: '#' },
    { id: 12, subject: 'Music', class: 'Grade 10', title: 'Music Theory', type: 'DOC', date: '2025-12-12', downloadUrl: '#' },
  ];

  dataChange: BehaviorSubject<Syllabus[]> = new BehaviorSubject<Syllabus[]>([]);

  constructor() {}

  get dataItems(): Syllabus[] {
    return this.dataChange.value;
  }

  getAllSyllabus(): Observable<Syllabus[]> {
    return of(this.data);
  }

  addSyllabus(syllabus: Syllabus): void {
    this.data.unshift(syllabus);
  }

  updateSyllabus(syllabus: Syllabus): void {
    const index = this.data.findIndex((it) => it.id === syllabus.id);
    if (index !== -1) {
      this.data[index] = syllabus;
    }
  }

  deleteSyllabus(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
