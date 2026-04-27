import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MarksEntry } from './marks-entry.model';

@Injectable({
  providedIn: 'root',
})
export class MarksEntryService {
  private readonly staticData: any[] = [
    {
      id: 1,
      exam_name: 'Mid-Term Jan 2024',
      student_name: 'John Doe',
      roll_no: 'CS101',
      subject: 'Mathematics',
      marks_obtained: 85,
      max_marks: 100,
      status: 'Passed',
    },
    {
      id: 2,
      exam_name: 'Mid-Term Jan 2024',
      student_name: 'Jane Smith',
      roll_no: 'CS102',
      subject: 'Mathematics',
      marks_obtained: 92,
      max_marks: 100,
      status: 'Passed',
    },
    {
      id: 3,
      exam_name: 'Mid-Term Jan 2024',
      student_name: 'Robert Brown',
      roll_no: 'CS103',
      subject: 'Mathematics',
      marks_obtained: 45,
      max_marks: 100,
      status: 'Passed',
    },
    {
      id: 4,
      exam_name: 'Mid-Term Jan 2024',
      student_name: 'Emily Davis',
      roll_no: 'CS104',
      subject: 'Physics',
      marks_obtained: 78,
      max_marks: 100,
      status: 'Passed',
    },
    {
      id: 5,
      exam_name: 'Mid-Term Jan 2024',
      student_name: 'Michael Wilson',
      roll_no: 'CS105',
      subject: 'Physics',
      marks_obtained: 25,
      max_marks: 100,
      status: 'Failed',
    },
    {
      id: 6,
      exam_name: 'Final Exam May 2024',
      student_name: 'Sarah Miller',
      roll_no: 'ME201',
      subject: 'Thermodynamics',
      marks_obtained: 88,
      max_marks: 100,
      status: 'Passed',
    },
    {
      id: 7,
      exam_name: 'Final Exam May 2024',
      student_name: 'David Taylor',
      roll_no: 'ME202',
      subject: 'Thermodynamics',
      marks_obtained: 95,
      max_marks: 100,
      status: 'Passed',
    },
    {
      id: 8,
      exam_name: 'Final Exam May 2024',
      student_name: 'Linda Garcia',
      roll_no: 'ME203',
      subject: 'Thermodynamics',
      marks_obtained: 38,
      max_marks: 100,
      status: 'Passed',
    },
    {
      id: 9,
      exam_name: 'Internal Assessment 1',
      student_name: 'James Anderson',
      roll_no: 'EC301',
      subject: 'Digital Logic',
      marks_obtained: 18,
      max_marks: 20,
      status: 'Passed',
    },
    {
      id: 10,
      exam_name: 'Internal Assessment 1',
      student_name: 'Barbara Thomas',
      roll_no: 'EC302',
      subject: 'Digital Logic',
      marks_obtained: 15,
      max_marks: 20,
      status: 'Passed',
    },
    {
      id: 11,
      exam_name: 'Quarterly Exam',
      student_name: 'William Moore',
      roll_no: 'S101',
      subject: 'Science',
      marks_obtained: 65,
      max_marks: 100,
      status: 'Passed',
    },
    {
      id: 12,
      exam_name: 'Quarterly Exam',
      student_name: 'Elizabeth Jackson',
      roll_no: 'S102',
      subject: 'Science',
      marks_obtained: 72,
      max_marks: 100,
      status: 'Passed',
    },
  ];

  dataChange: BehaviorSubject<MarksEntry[]> = new BehaviorSubject<MarksEntry[]>(
    []
  );

  constructor() {}

  get data(): MarksEntry[] {
    return this.dataChange.value;
  }

  getAllMarksEntries(): Observable<MarksEntry[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addMarksEntry(marksEntry: MarksEntry): Observable<MarksEntry> {
    this.staticData.push(marksEntry);
    this.dataChange.next(this.staticData);
    return of(marksEntry);
  }

  updateMarksEntry(marksEntry: MarksEntry): Observable<MarksEntry> {
    const index = this.staticData.findIndex((it) => it.id === marksEntry.id);
    if (index !== -1) {
      this.staticData[index] = marksEntry;
      this.dataChange.next(this.staticData);
    }
    return of(marksEntry);
  }

  deleteMarksEntry(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }

  deleteMultipleMarksEntries(ids: number[]): Observable<number[]> {
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
