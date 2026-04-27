import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { DueFees } from './due-fees.model';

@Injectable({
  providedIn: 'root',
})
export class DueFeesService {
  private readonly data: DueFees[] = [
    { id: 1, feeType: 'Exam Fee', dueDate: '2025-02-15', totalAmount: 1000, dueAmount: 1000, lateFee: 0, totalDue: 1000 },
    { id: 2, feeType: 'Sports Fee', dueDate: '2025-04-10', totalAmount: 300, dueAmount: 300, lateFee: 0, totalDue: 300 },
    { id: 3, feeType: 'Tuition Fee (Q2)', dueDate: '2025-04-10', totalAmount: 5000, dueAmount: 5000, lateFee: 0, totalDue: 5000 },
    { id: 4, feeType: 'Miscellaneous Fee', dueDate: '2025-05-15', totalAmount: 800, dueAmount: 800, lateFee: 0, totalDue: 800 },
    { id: 5, feeType: 'Lab Fee', dueDate: '2024-12-20', totalAmount: 1500, dueAmount: 1500, lateFee: 50, totalDue: 1550 },
    { id: 6, feeType: 'Library Fine', dueDate: '2024-12-25', totalAmount: 50, dueAmount: 50, lateFee: 10, totalDue: 60 },
    { id: 7, feeType: 'Hostel Fee (Partial)', dueDate: '2025-01-15', totalAmount: 8000, dueAmount: 4000, lateFee: 0, totalDue: 4000 },
    { id: 8, feeType: 'Transport Fee (Q2)', dueDate: '2025-04-05', totalAmount: 2000, dueAmount: 2000, lateFee: 0, totalDue: 2000 },
    { id: 9, feeType: 'Activity Fee', dueDate: '2025-03-05', totalAmount: 1200, dueAmount: 1200, lateFee: 0, totalDue: 1200 },
    { id: 10, feeType: 'Insurance Fee', dueDate: '2025-01-20', totalAmount: 2500, dueAmount: 2500, lateFee: 0, totalDue: 2500 },
    { id: 11, feeType: 'Uniform Fee', dueDate: '2025-01-25', totalAmount: 3000, dueAmount: 3000, lateFee: 0, totalDue: 3000 },
    { id: 12, feeType: 'Tuition Fee (Q3)', dueDate: '2025-07-10', totalAmount: 5000, dueAmount: 5000, lateFee: 0, totalDue: 5000 },
  ];

  dataChange: BehaviorSubject<DueFees[]> = new BehaviorSubject<DueFees[]>([]);

  constructor() {}

  get dataItems(): DueFees[] {
    return this.dataChange.value;
  }

  getAllDueFees(): Observable<DueFees[]> {
    return of(this.data);
  }

  addDueFee(dueFee: DueFees): void {
    this.data.unshift(dueFee);
  }

  updateDueFee(dueFee: DueFees): void {
    const index = this.data.findIndex((it) => it.id === dueFee.id);
    if (index !== -1) {
      this.data[index] = dueFee;
    }
  }

  deleteDueFee(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
