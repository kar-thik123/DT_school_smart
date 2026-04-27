import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AcademicYear } from './academic-year.model';

@Injectable({
  providedIn: 'root',
})
export class AcademicYearService {
  private academicYears: AcademicYear[] = [
    { id: 1, academicYear: '2020-21', status: 'Inactive', startDate: '2020-06-01', endDate: '2021-05-31', description: 'Academic Year 2020-21', department: 'All' },
    { id: 2, academicYear: '2021-22', status: 'Inactive', startDate: '2021-06-01', endDate: '2022-05-31', description: 'Academic Year 2021-22', department: 'All' },
    { id: 3, academicYear: '2022-23', status: 'Inactive', startDate: '2022-06-01', endDate: '2023-05-31', description: 'Academic Year 2022-23', department: 'All' },
    { id: 4, academicYear: '2023-24', status: 'Active', startDate: '2023-06-01', endDate: '2024-05-31', description: 'Academic Year 2023-24', department: 'All' },
    { id: 5, academicYear: '2024-25', status: 'Pending', startDate: '2024-06-01', endDate: '2025-05-31', description: 'Academic Year 2024-25', department: 'All' },
    { id: 6, academicYear: '2025-26', status: 'Planned', startDate: '2025-06-01', endDate: '2026-05-31', description: 'Academic Year 2025-26', department: 'All' },
    { id: 7, academicYear: '2019-20', status: 'Inactive', startDate: '2019-06-01', endDate: '2020-05-31', description: 'Academic Year 2019-20', department: 'All' },
    { id: 8, academicYear: '2018-19', status: 'Inactive', startDate: '2018-06-01', endDate: '2019-05-31', description: 'Academic Year 2018-19', department: 'All' },
    { id: 9, academicYear: '2017-18', status: 'Inactive', startDate: '2017-06-01', endDate: '2018-05-31', description: 'Academic Year 2017-18', department: 'All' },
    { id: 10, academicYear: '2016-17', status: 'Inactive', startDate: '2016-06-01', endDate: '2017-05-31', description: 'Academic Year 2016-17', department: 'All' },
    { id: 11, academicYear: '2015-16', status: 'Inactive', startDate: '2015-06-01', endDate: '2016-05-31', description: 'Academic Year 2015-16', department: 'All' },
    { id: 12, academicYear: '2026-27', status: 'Planned', startDate: '2026-06-01', endDate: '2027-05-31', description: 'Academic Year 2026-27', department: 'All' },
  ];

  dataChange: BehaviorSubject<AcademicYear[]> = new BehaviorSubject<AcademicYear[]>(
    []
  );

  /** GET: Fetch all academic years */
  getAllAcademicYears(): Observable<AcademicYear[]> {
    this.dataChange.next(this.academicYears);
    return of(this.academicYears);
  }

  /** POST: Add a new academic year */
  addAcademicYear(academicYear: AcademicYear): Observable<AcademicYear> {
    academicYear.id = Math.max(...this.academicYears.map(y => y.id), 0) + 1;
    this.academicYears.push(academicYear);
    this.dataChange.next(this.academicYears);
    return of(academicYear);
  }

  /** PUT: Update an existing academic year */
  updateAcademicYear(academicYear: AcademicYear): Observable<AcademicYear> {
    const index = this.academicYears.findIndex(y => y.id === academicYear.id);
    if (index !== -1) {
      this.academicYears[index] = academicYear;
      this.dataChange.next(this.academicYears);
    }
    return of(academicYear);
  }

  /** DELETE: Remove an academic year by ID */
  deleteAcademicYear(id: number): Observable<number> {
    this.academicYears = this.academicYears.filter(y => y.id !== id);
    this.dataChange.next(this.academicYears);
    return of(id);
  }
}
