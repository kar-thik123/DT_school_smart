import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { tap } from 'rxjs/operators';
import { AcademicYear } from './academic-year.model';

@Injectable({
  providedIn: 'root',
})
export class AcademicYearService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/academic/academic-years`;

  dataChange: BehaviorSubject<AcademicYear[]> = new BehaviorSubject<AcademicYear[]>([]);

  /** GET: Fetch all academic years */
  getAllAcademicYears(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap((years) => {
        const mapped = years.map(y => ({
          ...y,
          academicYear: y.name,
          status: y.is_active ? 'Active' : 'Inactive',
          startDate: y.start_date,
          endDate: y.end_date
        }));
        this.dataChange.next(mapped);
      })
    );
  }

  /** POST: Add a new academic year */
  addAcademicYear(academicYear: AcademicYear): Observable<AcademicYear> {
    return this.http.post<AcademicYear>(this.apiUrl, academicYear);
  }

  /** PUT: Update an existing academic year */
  updateAcademicYear(academicYear: AcademicYear): Observable<AcademicYear> {
    return this.http.put<AcademicYear>(`${this.apiUrl}/${academicYear.id}`, academicYear);
  }

  /** DELETE: Remove an academic year by ID */
  deleteAcademicYear(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`);
  }
}
