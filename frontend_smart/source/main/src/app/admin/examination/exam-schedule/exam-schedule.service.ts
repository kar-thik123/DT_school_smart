import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ExamSchedule } from './exam-schedule.model';

@Injectable({
  providedIn: 'root',
})
export class ExamScheduleService {
  private readonly staticData: any[] = [
    { id: 1, exam_type: 'Internal Assessment 1', course: 'B.Tech', semester: 'Sem 1', subject: 'Mathematics I', exam_date: '2024-01-15', start_time: '10:00 AM', end_time: '11:30 AM', room_no: '101' },
    { id: 2, exam_type: 'Internal Assessment 1', course: 'B.Tech', semester: 'Sem 1', subject: 'Physics I', exam_date: '2024-01-16', start_time: '10:00 AM', end_time: '11:30 AM', room_no: '102' },
    { id: 3, exam_type: 'Internal Assessment 1', course: 'B.Tech', semester: 'Sem 1', subject: 'Chemistry I', exam_date: '2024-01-17', start_time: '10:00 AM', end_time: '11:30 AM', room_no: '103' },
    { id: 4, exam_type: 'Internal Assessment 2', course: 'MBA', semester: 'Sem 2', subject: 'Marketing Management', exam_date: '2024-02-10', start_time: '02:00 PM', end_time: '03:30 PM', room_no: '201' },
    { id: 5, exam_type: 'Internal Assessment 2', course: 'MBA', semester: 'Sem 2', subject: 'Financial Accounting', exam_date: '2024-02-11', start_time: '02:00 PM', end_time: '03:30 PM', room_no: '202' },
    { id: 6, exam_type: 'Mid-Term Examination', course: 'B.Com', semester: 'Sem 3', subject: 'Business Law', exam_date: '2024-03-05', start_time: '10:00 AM', end_time: '01:00 PM', room_no: '301' },
    { id: 7, exam_type: 'Mid-Term Examination', course: 'B.Com', semester: 'Sem 3', subject: 'Corporate Accounting', exam_date: '2024-03-06', start_time: '10:00 AM', end_time: '01:00 PM', room_no: '302' },
    { id: 8, exam_type: 'End-Term Examination', course: 'B.Tech', semester: 'Sem 4', subject: 'Data Structures', exam_date: '2024-05-20', start_time: '10:00 AM', end_time: '01:00 PM', room_no: '401' },
    { id: 9, exam_type: 'End-Term Examination', course: 'B.Tech', semester: 'Sem 4', subject: 'Operating Systems', exam_date: '2024-05-22', start_time: '10:00 AM', end_time: '01:00 PM', room_no: '402' },
    { id: 10, exam_type: 'Practical Examination', course: 'B.Tech', semester: 'Sem 4', subject: 'DS Lab', exam_date: '2024-05-25', start_time: '09:00 AM', end_time: '12:00 PM', room_no: 'Lab 1' },
    { id: 11, exam_type: 'Quarterly Exam', course: 'School', semester: 'Class 10', subject: 'Science', exam_date: '2024-06-10', start_time: '08:30 AM', end_time: '11:30 AM', room_no: 'S1' },
    { id: 12, exam_type: 'Annual Exam', course: 'School', semester: 'Class 12', subject: 'English', exam_date: '2024-03-15', start_time: '09:00 AM', end_time: '12:00 PM', room_no: 'H1' },
  ];

  dataChange: BehaviorSubject<ExamSchedule[]> = new BehaviorSubject<ExamSchedule[]>([]);

  constructor() {}

  get data(): ExamSchedule[] {
    return this.dataChange.value;
  }

  getAllExamSchedules(): Observable<ExamSchedule[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addExamSchedule(examSchedule: ExamSchedule): Observable<ExamSchedule> {
    this.staticData.push(examSchedule);
    this.dataChange.next(this.staticData);
    return of(examSchedule);
  }

  updateExamSchedule(examSchedule: ExamSchedule): Observable<ExamSchedule> {
    const index = this.staticData.findIndex((it) => it.id === examSchedule.id);
    if (index !== -1) {
      this.staticData[index] = examSchedule;
      this.dataChange.next(this.staticData);
    }
    return of(examSchedule);
  }

  deleteExamSchedule(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }

  deleteMultipleExamSchedules(ids: number[]): Observable<number[]> {
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
