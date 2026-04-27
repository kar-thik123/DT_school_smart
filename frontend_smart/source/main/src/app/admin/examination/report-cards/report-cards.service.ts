import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ReportCard, ReportCardData } from './report-cards.model';

@Injectable({
  providedIn: 'root',
})
export class ReportCardsService {
  private readonly staticData: any[] = [
    new ReportCard({
      id: 1,
      student_name: 'John Doe',
      roll_no: 'CS101',
      exam_name: 'Mid-Term Jan 2024',
      total_marks: 450,
      percentage: 90,
      grade: 'A+',
      result: 'Pass',
    }),
    new ReportCard({
      id: 2,
      student_name: 'Jane Smith',
      roll_no: 'CS102',
      exam_name: 'Mid-Term Jan 2024',
      total_marks: 420,
      percentage: 84,
      grade: 'A',
      result: 'Pass',
    }),
    new ReportCard({
      id: 3,
      student_name: 'Robert Brown',
      roll_no: 'CS103',
      exam_name: 'Mid-Term Jan 2024',
      total_marks: 380,
      percentage: 76,
      grade: 'B+',
      result: 'Pass',
    }),
    new ReportCard({
      id: 4,
      student_name: 'Emily Davis',
      roll_no: 'CS104',
      exam_name: 'Mid-Term Jan 2024',
      total_marks: 350,
      percentage: 70,
      grade: 'B',
      result: 'Pass',
    }),
    new ReportCard({
      id: 5,
      student_name: 'Michael Wilson',
      roll_no: 'CS105',
      exam_name: 'Mid-Term Jan 2024',
      total_marks: 280,
      percentage: 56,
      grade: 'C',
      result: 'Pass',
    }),
    new ReportCard({
      id: 6,
      student_name: 'Sarah Miller',
      roll_no: 'ME201',
      exam_name: 'Final Exam May 2024',
      total_marks: 480,
      percentage: 96,
      grade: 'O',
      result: 'Pass',
    }),
    new ReportCard({
      id: 7,
      student_name: 'David Taylor',
      roll_no: 'ME202',
      exam_name: 'Final Exam May 2024',
      total_marks: 410,
      percentage: 82,
      grade: 'A',
      result: 'Pass',
    }),
    new ReportCard({
      id: 8,
      student_name: 'Linda Garcia',
      roll_no: 'ME203',
      exam_name: 'Final Exam May 2024',
      total_marks: 150,
      percentage: 30,
      grade: 'F',
      result: 'Fail',
    }),
  ];

  dataChange: BehaviorSubject<ReportCard[]> = new BehaviorSubject<ReportCard[]>(
    []
  );

  constructor() {}

  get data(): ReportCard[] {
    return this.dataChange.value;
  }

  getAllReportCards(): Observable<ReportCard[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addReportCard(reportCard: ReportCard): Observable<ReportCard> {
    this.staticData.push(reportCard);
    this.dataChange.next(this.staticData);
    return of(reportCard);
  }

  updateReportCard(reportCard: ReportCard): Observable<ReportCard> {
    const index = this.staticData.findIndex((it) => it.id === reportCard.id);
    if (index !== -1) {
      this.staticData[index] = reportCard;
      this.dataChange.next(this.staticData);
    }
    return of(reportCard);
  }

  deleteReportCard(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }

  deleteMultipleReportCards(ids: number[]): Observable<number[]> {
    ids.forEach((id) => {
      const index = this.staticData.findIndex((it) => it.id === id);
      if (index !== -1) {
        this.staticData.splice(index, 1);
      }
    });
    this.dataChange.next(this.staticData);
    return of(ids);
  }
}
