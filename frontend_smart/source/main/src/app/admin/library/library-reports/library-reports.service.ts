import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { LibraryReport } from './library-reports.model';

@Injectable({
  providedIn: 'root',
})
export class LibraryReportService {
  private readonly staticData: any[] = [
    {
      id: 1,
      report_name: 'Monthly Book Stock Report - Dec 2023',
      generated_date: '2023-12-25',
      type: 'Stock Report',
      status: 'Available',
    },
    {
      id: 2,
      report_name: 'Overdue Books List - Dec 2023',
      generated_date: '2023-12-24',
      type: 'Overdue Report',
      status: 'Available',
    },
    {
      id: 3,
      report_name: 'Student Borrowing History - Dec 2023',
      generated_date: '2023-12-23',
      type: 'Borrowing Report',
      status: 'Available',
    },
    {
      id: 4,
      report_name: 'Library Fines Summary - Q4 2023',
      generated_date: '2023-12-20',
      type: 'Finance Report',
      status: 'Processing',
    },
    {
      id: 5,
      report_name: 'New Arrivals Catalog - Dec 2023',
      generated_date: '2023-12-15',
      type: 'Catalog Report',
      status: 'Available',
    },
  ];

  dataChange: BehaviorSubject<LibraryReport[]> = new BehaviorSubject<LibraryReport[]>(
    []
  );

  constructor() {}

  get data(): LibraryReport[] {
    return this.dataChange.value;
  }

  getAllLibraryReports(): Observable<LibraryReport[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addLibraryReport(libraryReport: LibraryReport): Observable<LibraryReport> {
    this.staticData.push(libraryReport);
    this.dataChange.next(this.staticData);
    return of(libraryReport);
  }

  updateLibraryReport(libraryReport: LibraryReport): Observable<LibraryReport> {
    const index = this.staticData.findIndex((it) => it.id === libraryReport.id);
    if (index !== -1) {
      this.staticData[index] = libraryReport;
      this.dataChange.next(this.staticData);
    }
    return of(libraryReport);
  }

  deleteLibraryReport(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }

  deleteMultipleLibraryReports(ids: number[]): Observable<number[]> {
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
