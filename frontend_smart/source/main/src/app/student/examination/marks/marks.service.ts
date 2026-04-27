import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Marks } from './marks.model';

@Injectable({
  providedIn: 'root',
})
export class MarksService {
  private readonly data: Marks[] = [
    { id: 1, subject: 'Mathematics', examName: 'Mid Term 2025', obtainedMarks: 85, totalMarks: 100, grade: 'A', remarks: 'Excellent' },
    { id: 2, subject: 'Physics', examName: 'Mid Term 2025', obtainedMarks: 78, totalMarks: 100, grade: 'B+', remarks: 'Good' },
    { id: 3, subject: 'Chemistry', examName: 'Mid Term 2025', obtainedMarks: 92, totalMarks: 100, grade: 'A+', remarks: 'Outstanding' },
    { id: 4, subject: 'Biology', examName: 'Mid Term 2025', obtainedMarks: 80, totalMarks: 100, grade: 'A-', remarks: 'Very Good' },
    { id: 5, subject: 'English', examName: 'Mid Term 2025', obtainedMarks: 88, totalMarks: 100, grade: 'A', remarks: 'Good Improvement' },
    { id: 6, subject: 'History', examName: 'Mid Term 2025', obtainedMarks: 75, totalMarks: 100, grade: 'B', remarks: 'Satisfactory' },
    { id: 7, subject: 'Geography', examName: 'Mid Term 2025', obtainedMarks: 82, totalMarks: 100, grade: 'A-', remarks: 'Good' },
    { id: 8, subject: 'Computer Science', examName: 'Mid Term 2025', obtainedMarks: 95, totalMarks: 100, grade: 'A+', remarks: 'Exceptional' },
    { id: 9, subject: 'Economics', examName: 'Mid Term 2025', obtainedMarks: 70, totalMarks: 100, grade: 'C+', remarks: 'Need Improvement' },
    { id: 10, subject: 'Political Science', examName: 'Mid Term 2025', obtainedMarks: 84, totalMarks: 100, grade: 'A', remarks: 'Good' },
    { id: 11, subject: 'Art', examName: 'Mid Term 2025', obtainedMarks: 45, totalMarks: 50, grade: 'A+', remarks: 'Very Creative' },
    { id: 12, subject: 'Music', examName: 'Mid Term 2025', obtainedMarks: 40, totalMarks: 50, grade: 'A', remarks: 'Talented' },
  ];

  dataChange: BehaviorSubject<Marks[]> = new BehaviorSubject<Marks[]>([]);

  constructor() {}

  get dataItems(): Marks[] {
    return this.dataChange.value;
  }

  getAllMarks(): Observable<Marks[]> {
    return of(this.data);
  }

  addMarks(marks: Marks): void {
    this.data.unshift(marks);
  }

  updateMarks(marks: Marks): void {
    const index = this.data.findIndex((it) => it.id === marks.id);
    if (index !== -1) {
      this.data[index] = marks;
    }
  }

  deleteMarks(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
