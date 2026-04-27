import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { IssueReturn } from './issue-return.model';

@Injectable({
  providedIn: 'root',
})
export class IssueReturnService {
  private readonly staticData: any[] = [
    {
      id: 1,
      book_no: 'B101',
      book_title: 'Introduction to Algorithms',
      student_name: 'John Doe',
      roll_no: 'CS001',
      issue_date: '2023-12-01',
      return_date: '2023-12-15',
      status: 'Returned',
    },
    {
      id: 2,
      book_no: 'B105',
      book_title: 'Modern Operating Systems',
      student_name: 'Jane Smith',
      roll_no: 'CS002',
      issue_date: '2023-12-05',
      return_date: '2023-12-20',
      status: 'Issued',
    },
    {
      id: 3,
      book_no: 'B110',
      book_title: 'Database System Concepts',
      student_name: 'Robert Brown',
      roll_no: 'CS003',
      issue_date: '2023-11-20',
      return_date: '2023-12-05',
      status: 'Overdue',
    },
    {
      id: 4,
      book_no: 'B115',
      book_title: 'Computer Networks',
      student_name: 'Emily Davis',
      roll_no: 'CS004',
      issue_date: '2023-12-10',
      return_date: '2023-12-25',
      status: 'Issued',
    },
    {
      id: 5,
      book_no: 'B120',
      book_title: 'Software Engineering',
      student_name: 'Michael Wilson',
      roll_no: 'CS005',
      issue_date: '2023-12-15',
      return_date: '2023-12-30',
      status: 'Issued',
    },
  ];

  dataChange: BehaviorSubject<IssueReturn[]> = new BehaviorSubject<IssueReturn[]>(
    []
  );

  constructor() {}

  get data(): IssueReturn[] {
    return this.dataChange.value;
  }

  getAllIssueReturns(): Observable<IssueReturn[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addIssueReturn(issueReturn: IssueReturn): Observable<IssueReturn> {
    this.staticData.push(issueReturn);
    this.dataChange.next(this.staticData);
    return of(issueReturn);
  }

  updateIssueReturn(issueReturn: IssueReturn): Observable<IssueReturn> {
    const index = this.staticData.findIndex((it) => it.id === issueReturn.id);
    if (index !== -1) {
      this.staticData[index] = issueReturn;
      this.dataChange.next(this.staticData);
    }
    return of(issueReturn);
  }

  deleteIssueReturn(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }

  deleteMultipleIssueReturns(ids: number[]): Observable<number[]> {
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
