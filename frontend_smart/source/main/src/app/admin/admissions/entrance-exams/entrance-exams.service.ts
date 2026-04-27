import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { EntranceExam } from './entrance-exams.model';

@Injectable({
  providedIn: 'root',
})
export class EntranceExamService {
  dataChange: BehaviorSubject<EntranceExam[]> = new BehaviorSubject<EntranceExam[]>([]);

  private staticData: any[] = [
    { id: 1, exam_name: 'CS Entrance 2024', exam_code: 'CSE101', exam_date: '2024-05-10', start_time: '10:00 AM', end_time: '01:00 PM', venue: 'Hall A', max_marks: 100, passing_marks: 40, status: 'Scheduled', description: 'Entrance for CS Department', getRandomID: () => 1 },
    { id: 2, exam_name: 'MBA Entrance 2024', exam_code: 'MBA202', exam_date: '2024-05-12', start_time: '02:00 PM', end_time: '05:00 PM', venue: 'Hall B', max_marks: 100, passing_marks: 50, status: 'Scheduled', description: 'Entrance for Management', getRandomID: () => 2 },
    { id: 3, exam_name: 'Law Entrance 2024', exam_code: 'LAW303', exam_date: '2024-05-15', start_time: '09:00 AM', end_time: '12:00 PM', venue: 'Hall C', max_marks: 150, passing_marks: 75, status: 'Completed', description: 'Entrance for Law School', getRandomID: () => 3 },
    { id: 4, exam_name: 'Eng Entrance 2024', exam_code: 'ENG404', exam_date: '2024-05-18', start_time: '10:00 AM', end_time: '01:00 PM', venue: 'Hall A', max_marks: 120, passing_marks: 60, status: 'Cancelled', description: 'Entrance for Engineering', getRandomID: () => 4 },
    { id: 5, exam_name: 'Med Entrance 2024', exam_code: 'MED505', exam_date: '2024-05-20', start_time: '02:00 PM', end_time: '05:00 PM', venue: 'Main Lab', max_marks: 200, passing_marks: 100, status: 'Scheduled', description: 'Entrance for Medical Science', getRandomID: () => 5 },
    { id: 6, exam_name: 'Arts Entrance 2024', exam_code: 'ART606', exam_date: '2024-05-22', start_time: '09:00 AM', end_time: '12:00 PM', venue: 'Auditorium', max_marks: 100, passing_marks: 35, status: 'Scheduled', description: 'Entrance for Fine Arts', getRandomID: () => 6 },
    { id: 7, exam_name: 'Physics Entrance 2024', exam_code: 'PHY707', exam_date: '2024-05-25', start_time: '10:00 AM', end_time: '01:00 PM', venue: 'Science Block', max_marks: 100, passing_marks: 45, status: 'Scheduled', description: 'Entrance for Physics Honors', getRandomID: () => 7 },
    { id: 8, exam_name: 'Chem Entrance 2024', exam_code: 'CHE808', exam_date: '2024-05-28', start_time: '02:00 PM', end_time: '05:00 PM', venue: 'Chem Lab 1', max_marks: 100, passing_marks: 45, status: 'Scheduled', description: 'Entrance for Chemistry Honors', getRandomID: () => 8 },
    { id: 9, exam_name: 'Math Entrance 2024', exam_code: 'MAT909', exam_date: '2024-05-30', start_time: '09:00 AM', end_time: '12:00 PM', venue: 'Math Hall', max_marks: 100, passing_marks: 50, status: 'Scheduled', description: 'Entrance for Mathematics', getRandomID: () => 9 },
    { id: 10, exam_name: 'History Entrance 2024', exam_code: 'HIS111', exam_date: '2024-06-02', start_time: '10:00 AM', end_time: '01:00 PM', venue: 'Library Hall', max_marks: 100, passing_marks: 40, status: 'Scheduled', description: 'Entrance for History', getRandomID: () => 10 },
    { id: 11, exam_name: 'Bio Entrance 2024', exam_code: 'BIO222', exam_date: '2024-06-05', start_time: '02:00 PM', end_time: '05:00 PM', venue: 'Bio Lab 2', max_marks: 100, passing_marks: 45, status: 'Scheduled', description: 'Entrance for Biology', getRandomID: () => 11 },
    { id: 12, exam_name: 'Geo Entrance 2024', exam_code: 'GEO333', exam_date: '2024-06-08', start_time: '09:00 AM', end_time: '12:00 PM', venue: 'Geo Dept', max_marks: 100, passing_marks: 40, status: 'Scheduled', description: 'Entrance for Geography', getRandomID: () => 12 },
  ];

  get data(): EntranceExam[] {
    return this.dataChange.value;
  }

  getAllEntranceExams(): Observable<EntranceExam[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addEntranceExam(entranceExam: EntranceExam): Observable<EntranceExam> {
    this.staticData.push(entranceExam);
    this.dataChange.next(this.staticData);
    return of(entranceExam);
  }

  updateEntranceExam(entranceExam: EntranceExam): Observable<EntranceExam> {
    const index = this.staticData.findIndex((item) => item.id === entranceExam.id);
    if (index !== -1) {
      this.staticData[index] = entranceExam;
      this.dataChange.next(this.staticData);
    }
    return of(entranceExam);
  }

  deleteEntranceExam(id: number): Observable<number> {
    const index = this.staticData.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
