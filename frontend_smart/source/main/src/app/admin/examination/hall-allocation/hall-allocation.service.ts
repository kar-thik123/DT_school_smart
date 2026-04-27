import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HallAllocation } from './hall-allocation.model';

@Injectable({
  providedIn: 'root',
})
export class HallAllocationService {
  private readonly staticData: any[] = [
    { id: 1, exam_name: 'Mid-Term Jan 2024', student_name: 'John Doe', roll_no: 'CS101', hall_no: 'Hall A', seat_no: 'S1' },
    { id: 2, exam_name: 'Mid-Term Jan 2024', student_name: 'Jane Smith', roll_no: 'CS102', hall_no: 'Hall A', seat_no: 'S2' },
    { id: 3, exam_name: 'Mid-Term Jan 2024', student_name: 'Robert Brown', roll_no: 'CS103', hall_no: 'Hall A', seat_no: 'S3' },
    { id: 4, exam_name: 'Mid-Term Jan 2024', student_name: 'Emily Davis', roll_no: 'CS104', hall_no: 'Hall B', seat_no: 'S1' },
    { id: 5, exam_name: 'Mid-Term Jan 2024', student_name: 'Michael Wilson', roll_no: 'CS105', hall_no: 'Hall B', seat_no: 'S2' },
    { id: 6, exam_name: 'Final Exam May 2024', student_name: 'Sarah Miller', roll_no: 'ME201', hall_no: 'Hall C', seat_no: 'A10' },
    { id: 7, exam_name: 'Final Exam May 2024', student_name: 'David Taylor', roll_no: 'ME202', hall_no: 'Hall C', seat_no: 'A11' },
    { id: 8, exam_name: 'Final Exam May 2024', student_name: 'Linda Garcia', roll_no: 'ME203', hall_no: 'Hall C', seat_no: 'A12' },
    { id: 9, exam_name: 'Entrance Test 2024', student_name: 'James Anderson', roll_no: 'ENT001', hall_no: 'Main Hall', seat_no: 'M01' },
    { id: 10, exam_name: 'Entrance Test 2024', student_name: 'Barbara Thomas', roll_no: 'ENT002', hall_no: 'Main Hall', seat_no: 'M02' },
    { id: 11, exam_name: 'Internal Assessment 1', student_name: 'William Moore', roll_no: 'EC301', hall_no: 'Room 101', seat_no: 'R1' },
    { id: 12, exam_name: 'Internal Assessment 1', student_name: 'Elizabeth Jackson', roll_no: 'EC302', hall_no: 'Room 101', seat_no: 'R2' },
  ];

  dataChange: BehaviorSubject<HallAllocation[]> = new BehaviorSubject<HallAllocation[]>([]);

  constructor() {}

  get data(): HallAllocation[] {
    return this.dataChange.value;
  }

  getAllHallAllocations(): Observable<HallAllocation[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addHallAllocation(hallAllocation: HallAllocation): Observable<HallAllocation> {
    this.staticData.push(hallAllocation);
    this.dataChange.next(this.staticData);
    return of(hallAllocation);
  }

  updateHallAllocation(hallAllocation: HallAllocation): Observable<HallAllocation> {
    const index = this.staticData.findIndex((it) => it.id === hallAllocation.id);
    if (index !== -1) {
      this.staticData[index] = hallAllocation;
      this.dataChange.next(this.staticData);
    }
    return of(hallAllocation);
  }

  deleteHallAllocation(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }

  deleteMultipleHallAllocations(ids: number[]): Observable<number[]> {
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
