import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { AcademicRule, IAcademicRule } from './academic-rule.model';

@Injectable({
  providedIn: 'root',
})
export class AcademicRuleService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<AcademicRule[]> = new BehaviorSubject<AcademicRule[]>([]);

  private staticData: IAcademicRule[] = [
    { id: 1, ruleName: 'Minimum Attendance', category: 'General', appliedTo: 'All Students', priority: 'High', effectiveDate: '2024-01-01', description: 'Students must maintain 75% attendance to appear in exams', status: 'Active' },
    { id: 2, ruleName: 'Late Submission Penalty', category: 'Academic', appliedTo: 'All Students', priority: 'Medium', effectiveDate: '2024-01-01', description: '5% marks per day deduction for late assignments', status: 'Active' },
    { id: 3, ruleName: 'Pass Percentage', category: 'Exam', appliedTo: 'All Classes', priority: 'High', effectiveDate: '2024-01-01', description: 'Minimum 40% marks required to pass each subject', status: 'Active' },
    { id: 4, ruleName: 'Re-evaluation Policy', category: 'Exam', appliedTo: 'Board Classes', priority: 'Medium', effectiveDate: '2024-01-15', description: 'Application for re-check within 10 days of results', status: 'Active' },
    { id: 5, ruleName: 'Scholarship Eligibility', category: 'Financial', appliedTo: 'Merit Students', priority: 'Medium', effectiveDate: '2024-02-01', description: 'Minimum 90% in previous term for 50% fee wave', status: 'Active' },
    { id: 6, ruleName: 'Code of Conduct', category: 'Discipline', appliedTo: 'Everyone', priority: 'High', effectiveDate: '2024-01-01', description: 'Guidelines for behavior and ethics on campus', status: 'Active' },
    { id: 7, ruleName: 'Uniform Policy', category: 'General', appliedTo: 'Students', priority: 'Low', effectiveDate: '2024-01-01', description: 'Complete uniform required during school hours', status: 'Active' },
    { id: 8, ruleName: 'Library Fine', category: 'Facility', appliedTo: 'Borrowers', priority: 'Low', effectiveDate: '2024-03-01', description: '$1 per day fine for overdue books', status: 'Active' },
    { id: 9, ruleName: 'Mobile Phone Ban', category: 'Discipline', appliedTo: 'Students', priority: 'Medium', effectiveDate: '2024-01-01', description: 'Use of mobile phones prohibited in classrooms', status: 'Active' },
    { id: 10, ruleName: 'Laboratory Safety', category: 'Academic', appliedTo: 'Science Students', priority: 'High', effectiveDate: '2024-01-01', description: 'Safety gear mandatory during experiments', status: 'Active' },
    { id: 11, ruleName: 'Credit System', category: 'Academic', appliedTo: 'Higher Secondary', priority: 'Medium', effectiveDate: '2024-06-01', description: 'Minimum 12 credits required to move to next level', status: 'Draft' },
    { id: 12, ruleName: 'Early Departure', category: 'General', appliedTo: 'Students', priority: 'Medium', effectiveDate: '2024-01-01', description: 'Written permission required from Principal for early exit', status: 'Active' },
    { id: 13, ruleName: 'Sports Participation', category: 'Extracurricular', appliedTo: 'U-14, U-17', priority: 'Low', effectiveDate: '2024-04-01', description: 'Students must participate in at least one sport', status: 'Active' },
  ];

  getAllRules(): Observable<AcademicRule[]> {
    return of(this.staticData as AcademicRule[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addRule(rule: AcademicRule): Observable<AcademicRule> {
    return of(rule).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateRule(rule: AcademicRule): Observable<AcademicRule> {
    return of(rule).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteRule(id: number): Observable<number> {
    return of(id).pipe(
      map((_response) => id),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}
