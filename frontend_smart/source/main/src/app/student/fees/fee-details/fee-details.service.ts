import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { FeeDetails } from './fee-details.model';

@Injectable({
  providedIn: 'root',
})
export class FeeDetailsService {
  private readonly data: FeeDetails[] = [
    { id: 1, feeType: 'Tuition Fee', dueDate: '2025-01-10', amount: 5000, paidAmount: 5000, balanceAmount: 0, status: 'Paid', paymentMethod: 'Online' },
    { id: 2, feeType: 'Exam Fee', dueDate: '2025-02-15', amount: 1000, paidAmount: 0, balanceAmount: 1000, status: 'Unpaid', paymentMethod: '-' },
    { id: 3, feeType: 'Library Fee', dueDate: '2025-03-20', amount: 500, paidAmount: 500, balanceAmount: 0, status: 'Paid', paymentMethod: 'Cash' },
    { id: 4, feeType: 'Transport Fee', dueDate: '2025-01-05', amount: 2000, paidAmount: 2000, balanceAmount: 0, status: 'Paid', paymentMethod: 'Online' },
    { id: 5, feeType: 'Hostel Fee', dueDate: '2025-01-15', amount: 8000, paidAmount: 4000, balanceAmount: 4000, status: 'Partial', paymentMethod: 'Online' },
    { id: 6, feeType: 'Sports Fee', dueDate: '2025-04-10', amount: 300, paidAmount: 0, balanceAmount: 300, status: 'Unpaid', paymentMethod: '-' },
    { id: 7, feeType: 'Tuition Fee (Q2)', dueDate: '2025-04-10', amount: 5000, paidAmount: 0, balanceAmount: 5000, status: 'Unpaid', paymentMethod: '-' },
    { id: 8, feeType: 'Lab Fee', dueDate: '2025-02-28', amount: 1500, paidAmount: 1500, balanceAmount: 0, status: 'Paid', paymentMethod: 'Online' },
    { id: 9, feeType: 'Activity Fee', dueDate: '2025-03-05', amount: 1200, paidAmount: 1200, balanceAmount: 0, status: 'Paid', paymentMethod: 'Cash' },
    { id: 10, feeType: 'Insurance Fee', dueDate: '2025-01-20', amount: 2500, paidAmount: 2500, balanceAmount: 0, status: 'Paid', paymentMethod: 'Online' },
    { id: 11, feeType: 'Miscellaneous Fee', dueDate: '2025-05-15', amount: 800, paidAmount: 0, balanceAmount: 800, status: 'Unpaid', paymentMethod: '-' },
    { id: 12, feeType: 'Uniform Fee', dueDate: '2025-01-25', amount: 3000, paidAmount: 3000, balanceAmount: 0, status: 'Paid', paymentMethod: 'Cash' },
  ];

  dataChange: BehaviorSubject<FeeDetails[]> = new BehaviorSubject<FeeDetails[]>([]);

  constructor() {}

  get dataItems(): FeeDetails[] {
    return this.dataChange.value;
  }

  getAllFeeDetails(): Observable<FeeDetails[]> {
    return of(this.data);
  }

  addFeeDetail(feeDetail: FeeDetails): void {
    this.data.unshift(feeDetail);
  }

  updateFeeDetail(feeDetail: FeeDetails): void {
    const index = this.data.findIndex((it) => it.id === feeDetail.id);
    if (index !== -1) {
      this.data[index] = feeDetail;
    }
  }

  deleteFeeDetail(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
