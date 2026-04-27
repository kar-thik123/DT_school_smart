import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MarksEntry } from './marks-entry.model';

@Injectable({
  providedIn: 'root',
})
export class MarksEntryService {
  private httpClient = inject(HttpClient);

  private readonly mockData: MarksEntry[] = [
    { id: 1, rollNo: '101', studentName: 'John Doe', class: '10A', subject: 'Mathematics', marksObtained: 85, maxMarks: 100, status: 'Submitted' },
    { id: 2, rollNo: '102', studentName: 'Jane Smith', class: '10A', subject: 'Mathematics', marksObtained: 78, maxMarks: 100, status: 'Submitted' },
    { id: 3, rollNo: '103', studentName: 'Alice Johnson', class: '10A', subject: 'Mathematics', marksObtained: 92, maxMarks: 100, status: 'Submitted' },
    { id: 4, rollNo: '104', studentName: 'Bob Brown', class: '10A', subject: 'Mathematics', marksObtained: 65, maxMarks: 100, status: 'Pending' },
    { id: 5, rollNo: '105', studentName: 'Charlie Davis', class: '10A', subject: 'Mathematics', marksObtained: 70, maxMarks: 100, status: 'Submitted' },
    { id: 6, rollNo: '106', studentName: 'Eva White', class: '10A', subject: 'Mathematics', marksObtained: 88, maxMarks: 100, status: 'Submitted' },
    { id: 7, rollNo: '107', studentName: 'Frank Black', class: '10A', subject: 'Mathematics', marksObtained: 75, maxMarks: 100, status: 'Submitted' },
    { id: 8, rollNo: '108', studentName: 'Grace Miller', class: '10A', subject: 'Mathematics', marksObtained: 95, maxMarks: 100, status: 'Submitted' },
    { id: 9, rollNo: '109', studentName: 'Henry Wilson', class: '10A', subject: 'Mathematics', marksObtained: 55, maxMarks: 100, status: 'Pending' },
    { id: 10, rollNo: '110', studentName: 'Isabella Taylor', class: '10A', subject: 'Mathematics', marksObtained: 82, maxMarks: 100, status: 'Submitted' },
    { id: 11, rollNo: '111', studentName: 'Jack Anderson', class: '10A', subject: 'Mathematics', marksObtained: 79, maxMarks: 100, status: 'Submitted' },
    { id: 12, rollNo: '112', studentName: 'Katherine Thomas', class: '10A', subject: 'Mathematics', marksObtained: 89, maxMarks: 100, status: 'Submitted' },
  ];

  getAllMarks(): Observable<MarksEntry[]> {
    return of(this.mockData);
  }

  addMarks(marks: MarksEntry): Observable<MarksEntry> {
    this.mockData.unshift(marks);
    return of(marks);
  }

  updateMarks(marks: MarksEntry): Observable<MarksEntry> {
    const index = this.mockData.findIndex((it) => it.id === marks.id);
    if (index !== -1) {
      this.mockData[index] = marks;
    }
    return of(marks);
  }

  deleteMarks(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}

