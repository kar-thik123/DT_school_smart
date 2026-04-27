import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MonthlySummary } from './monthly-summary.model';

@Injectable({
  providedIn: 'root',
})
export class MonthlySummaryService {
  private readonly data: MonthlySummary[] = [
    { id: 1, month: 'January 2025', totalDays: 31, present: 25, absent: 2, late: 3, halfDay: 1, percentage: 80.65 },
    { id: 2, month: 'February 2025', totalDays: 28, present: 22, absent: 3, late: 2, halfDay: 1, percentage: 78.57 },
    { id: 3, month: 'March 2025', totalDays: 31, present: 28, absent: 1, late: 1, halfDay: 1, percentage: 90.32 },
    { id: 4, month: 'April 2025', totalDays: 30, present: 26, absent: 2, late: 1, halfDay: 1, percentage: 86.67 },
    { id: 5, month: 'May 2025', totalDays: 31, present: 24, absent: 4, late: 2, halfDay: 1, percentage: 77.42 },
    { id: 6, month: 'June 2025', totalDays: 30, present: 27, absent: 1, late: 1, halfDay: 1, percentage: 90.00 },
    { id: 7, month: 'July 2025', totalDays: 31, present: 29, absent: 1, late: 0, halfDay: 1, percentage: 93.55 },
    { id: 8, month: 'August 2025', totalDays: 31, present: 26, absent: 2, late: 2, halfDay: 1, percentage: 83.87 },
    { id: 9, month: 'September 2025', totalDays: 30, present: 25, absent: 3, late: 1, halfDay: 1, percentage: 83.33 },
    { id: 10, month: 'October 2025', totalDays: 31, present: 28, absent: 1, late: 1, halfDay: 1, percentage: 90.32 },
    { id: 11, month: 'November 2025', totalDays: 30, present: 27, absent: 1, late: 1, halfDay: 1, percentage: 90.00 },
    { id: 12, month: 'December 2025', totalDays: 31, present: 26, absent: 2, late: 2, halfDay: 1, percentage: 83.87 },
  ];

  dataChange: BehaviorSubject<MonthlySummary[]> = new BehaviorSubject<MonthlySummary[]>([]);

  constructor() {}

  get dataItems(): MonthlySummary[] {
    return this.dataChange.value;
  }

  getAllSummaries(): Observable<MonthlySummary[]> {
    return of(this.data);
  }

  addSummary(summary: MonthlySummary): void {
    this.data.unshift(summary);
  }

  updateSummary(summary: MonthlySummary): void {
    const index = this.data.findIndex((it) => it.id === summary.id);
    if (index !== -1) {
      this.data[index] = summary;
    }
  }

  deleteSummary(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
