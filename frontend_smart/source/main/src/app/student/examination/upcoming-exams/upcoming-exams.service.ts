import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { UpcomingExam } from './upcoming-exams.model';

@Injectable({
  providedIn: 'root',
})
export class UpcomingExamsService {
  private readonly data: UpcomingExam[] = [
    { id: 1, examName: 'Mid-Term', subject: 'Mathematics', examDate: '2025-05-10', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '101', totalMarks: 100 },
    { id: 2, examName: 'Mid-Term', subject: 'Science', examDate: '2025-05-12', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '102', totalMarks: 100 },
    { id: 3, examName: 'Mid-Term', subject: 'English', examDate: '2025-05-14', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '103', totalMarks: 100 },
    { id: 4, examName: 'Mid-Term', subject: 'History', examDate: '2025-05-16', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '104', totalMarks: 100 },
    { id: 5, examName: 'Mid-Term', subject: 'Geography', examDate: '2025-05-18', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '105', totalMarks: 100 },
    { id: 6, examName: 'Unit Test 2', subject: 'Mathematics', examDate: '2025-06-05', startTime: '10:00 AM', endTime: '11:30 AM', roomNo: '201', totalMarks: 50 },
    { id: 7, examName: 'Unit Test 2', subject: 'Science', examDate: '2025-06-07', startTime: '10:00 AM', endTime: '11:30 AM', roomNo: '202', totalMarks: 50 },
    { id: 8, examName: 'Unit Test 2', subject: 'English', examDate: '2025-06-09', startTime: '10:00 AM', endTime: '11:30 AM', roomNo: '203', totalMarks: 50 },
    { id: 9, examName: 'Final Exam', subject: 'Mathematics', examDate: '2025-11-10', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '301', totalMarks: 100 },
    { id: 10, examName: 'Final Exam', subject: 'Science', examDate: '2025-11-12', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '302', totalMarks: 100 },
    { id: 11, examName: 'Final Exam', subject: 'English', examDate: '2025-11-14', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '303', totalMarks: 100 },
    { id: 12, examName: 'Final Exam', subject: 'History', examDate: '2025-11-16', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: '304', totalMarks: 100 },
  ];

  dataChange: BehaviorSubject<UpcomingExam[]> = new BehaviorSubject<UpcomingExam[]>([]);

  constructor() {}

  get dataItems(): UpcomingExam[] {
    return this.dataChange.value;
  }

  getAllUpcomingExams(): Observable<UpcomingExam[]> {
    return of(this.data);
  }

  addUpcomingExam(exam: UpcomingExam): void {
    this.data.unshift(exam);
  }

  updateUpcomingExam(exam: UpcomingExam): void {
    const index = this.data.findIndex((it) => it.id === exam.id);
    if (index !== -1) {
      this.data[index] = exam;
    }
  }

  deleteUpcomingExam(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
