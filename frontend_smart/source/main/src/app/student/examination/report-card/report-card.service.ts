import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ReportCard } from './report-card.model';

@Injectable({
  providedIn: 'root',
})
export class ReportCardService {
  private readonly data: ReportCard[] = [
    { id: 1, academicYear: '2024-2025', className: '10th Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 540, percentage: 90.00, grade: 'A+', result: 'Pass', downloadUrl: '#' },
    { id: 2, academicYear: '2023-2024', className: '9th Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 510, percentage: 85.00, grade: 'A', result: 'Pass', downloadUrl: '#' },
    { id: 3, academicYear: '2022-2023', className: '8th Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 520, percentage: 86.67, grade: 'A', result: 'Pass', downloadUrl: '#' },
    { id: 4, academicYear: '2021-2022', className: '7th Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 480, percentage: 80.00, grade: 'B+', result: 'Pass', downloadUrl: '#' },
    { id: 5, academicYear: '2020-2021', className: '6th Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 550, percentage: 91.67, grade: 'A+', result: 'Pass', downloadUrl: '#' },
    { id: 6, academicYear: '2019-2020', className: '5th Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 500, percentage: 83.33, grade: 'A', result: 'Pass', downloadUrl: '#' },
    { id: 7, academicYear: '2018-2019', className: '4th Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 530, percentage: 88.33, grade: 'A', result: 'Pass', downloadUrl: '#' },
    { id: 8, academicYear: '2017-2018', className: '3rd Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 490, percentage: 81.67, grade: 'B+', result: 'Pass', downloadUrl: '#' },
    { id: 9, academicYear: '2016-2017', className: '2nd Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 545, percentage: 90.83, grade: 'A+', result: 'Pass', downloadUrl: '#' },
    { id: 10, academicYear: '2015-2016', className: '1st Standard', examName: 'Annual Exam', totalMarks: 600, obtainedMarks: 505, percentage: 84.17, grade: 'A', result: 'Pass', downloadUrl: '#' },
    { id: 11, academicYear: '2024-2025', className: '10th Standard', examName: 'Mid Term Exam', totalMarks: 300, obtainedMarks: 270, percentage: 90.00, grade: 'A+', result: 'Pass', downloadUrl: '#' },
    { id: 12, academicYear: '2023-2024', className: '9th Standard', examName: 'Mid Term Exam', totalMarks: 300, obtainedMarks: 255, percentage: 85.00, grade: 'A', result: 'Pass', downloadUrl: '#' },
  ];

  dataChange: BehaviorSubject<ReportCard[]> = new BehaviorSubject<ReportCard[]>([]);

  constructor() {}

  get dataItems(): ReportCard[] {
    return this.dataChange.value;
  }

  getAllReportCards(): Observable<ReportCard[]> {
    return of(this.data);
  }

  addReportCard(reportCard: ReportCard): void {
    this.data.unshift(reportCard);
  }

  updateReportCard(reportCard: ReportCard): void {
    const index = this.data.findIndex((it) => it.id === reportCard.id);
    if (index !== -1) {
      this.data[index] = reportCard;
    }
  }

  deleteReportCard(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
