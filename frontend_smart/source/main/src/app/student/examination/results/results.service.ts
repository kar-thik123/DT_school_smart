import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Results } from './results.model';

@Injectable({
  providedIn: 'root',
})
export class ResultsService {
  private readonly data: Results[] = [
    { id: 1, examName: 'Final Exam 2024', totalSubjects: 6, totalMarks: 600, obtainedMarks: 540, percentage: 90.00, grade: 'A+', resultStatus: 'Pass', publishedDate: '2024-05-15' },
    { id: 2, examName: 'Mid Term 2024', totalSubjects: 6, totalMarks: 600, obtainedMarks: 510, percentage: 85.00, grade: 'A', resultStatus: 'Pass', publishedDate: '2024-10-10' },
    { id: 3, examName: 'Final Exam 2023', totalSubjects: 6, totalMarks: 600, obtainedMarks: 520, percentage: 86.67, grade: 'A', resultStatus: 'Pass', publishedDate: '2023-05-20' },
    { id: 4, examName: 'Mid Term 2023', totalSubjects: 6, totalMarks: 600, obtainedMarks: 480, percentage: 80.00, grade: 'B+', resultStatus: 'Pass', publishedDate: '2023-10-12' },
    { id: 5, examName: 'Final Exam 2022', totalSubjects: 6, totalMarks: 600, obtainedMarks: 550, percentage: 91.67, grade: 'A+', resultStatus: 'Pass', publishedDate: '2022-05-18' },
    { id: 6, examName: 'Mid Term 2022', totalSubjects: 6, totalMarks: 600, obtainedMarks: 500, percentage: 83.33, grade: 'A', resultStatus: 'Pass', publishedDate: '2022-10-15' },
    { id: 7, examName: 'Final Exam 2021', totalSubjects: 6, totalMarks: 600, obtainedMarks: 530, percentage: 88.33, grade: 'A', resultStatus: 'Pass', publishedDate: '2021-05-22' },
    { id: 8, examName: 'Mid Term 2021', totalSubjects: 6, totalMarks: 600, obtainedMarks: 490, percentage: 81.67, grade: 'B+', resultStatus: 'Pass', publishedDate: '2021-10-18' },
    { id: 9, examName: 'Final Exam 2020', totalSubjects: 6, totalMarks: 600, obtainedMarks: 545, percentage: 90.83, grade: 'A+', resultStatus: 'Pass', publishedDate: '2020-05-25' },
    { id: 10, examName: 'Mid Term 2020', totalSubjects: 6, totalMarks: 600, obtainedMarks: 505, percentage: 84.17, grade: 'A', resultStatus: 'Pass', publishedDate: '2020-10-20' },
    { id: 11, examName: 'Final Exam 2019', totalSubjects: 6, totalMarks: 600, obtainedMarks: 535, percentage: 89.17, grade: 'A', resultStatus: 'Pass', publishedDate: '2019-05-28' },
    { id: 12, examName: 'Mid Term 2019', totalSubjects: 6, totalMarks: 600, obtainedMarks: 495, percentage: 82.50, grade: 'A', resultStatus: 'Pass', publishedDate: '2019-10-22' },
  ];

  dataChange: BehaviorSubject<Results[]> = new BehaviorSubject<Results[]>([]);

  constructor() {}

  get dataItems(): Results[] {
    return this.dataChange.value;
  }

  getAllResults(): Observable<Results[]> {
    return of(this.data);
  }

  addResult(result: Results): void {
    this.data.unshift(result);
  }

  updateResult(result: Results): void {
    const index = this.data.findIndex((it) => it.id === result.id);
    if (index !== -1) {
      this.data[index] = result;
    }
  }

  deleteResult(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
