import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { FeeReceipt } from './fee-receipts.model';

@Injectable({
  providedIn: 'root',
})
export class FeeReceiptsService {
  private readonly data: FeeReceipt[] = [
    { id: 1, receiptNo: 'RCP-2025-001', feeType: 'Tuition Fee', paymentDate: '2025-01-10', paidAmount: 5000, paymentMode: 'Cash', status: 'Success' },
    { id: 2, receiptNo: 'RCP-2025-002', feeType: 'Library Fee', paymentDate: '2025-01-12', paidAmount: 500, paymentMode: 'Online', status: 'Success' },
    { id: 3, receiptNo: 'RCP-2025-003', feeType: 'Transport Fee', paymentDate: '2025-01-15', paidAmount: 2000, paymentMode: 'Cheque', status: 'Printed' },
    { id: 4, receiptNo: 'RCP-2025-004', feeType: 'Hostel Fee', paymentDate: '2025-01-20', paidAmount: 4000, paymentMode: 'Online', status: 'Success' },
    { id: 5, receiptNo: 'RCP-2025-005', feeType: 'Admission Fee', paymentDate: '2025-01-05', paidAmount: 10000, paymentMode: 'Online', status: 'Success' },
    { id: 6, receiptNo: 'RCP-2025-006', feeType: 'Exam Fee', paymentDate: '2025-02-15', paidAmount: 1500, paymentMode: 'Cash', status: 'Cancelled' },
    { id: 7, receiptNo: 'RCP-2025-007', feeType: 'Activity Fee', paymentDate: '2025-02-20', paidAmount: 1200, paymentMode: 'Online', status: 'Success' },
    { id: 8, receiptNo: 'RCP-2025-008', feeType: 'Lab Fee', paymentDate: '2025-02-25', paidAmount: 800, paymentMode: 'Online', status: 'Success' },
    { id: 9, receiptNo: 'RCP-2025-009', feeType: 'Tuition Fee', paymentDate: '2025-04-10', paidAmount: 5000, paymentMode: 'Online', status: 'Success' },
    { id: 10, receiptNo: 'RCP-2025-010', feeType: 'Uniform Fee', paymentDate: '2025-04-12', paidAmount: 3000, paymentMode: 'Cash', status: 'Printed' },
    { id: 11, receiptNo: 'RCP-2025-011', feeType: 'Miscellaneous Fee', paymentDate: '2025-04-15', paidAmount: 500, paymentMode: 'Online', status: 'Success' },
    { id: 12, receiptNo: 'RCP-2025-012', feeType: 'Sports Fee', paymentDate: '2025-04-20', paidAmount: 1000, paymentMode: 'Online', status: 'Success' },
  ];

  dataChange: BehaviorSubject<FeeReceipt[]> = new BehaviorSubject<FeeReceipt[]>([]);

  constructor() {}

  get dataItems(): FeeReceipt[] {
    return this.dataChange.value;
  }

  getAllFeeReceipts(): Observable<FeeReceipt[]> {
    return of(this.data);
  }

  addFeeReceipt(receipt: FeeReceipt): void {
    this.data.unshift(receipt);
  }

  updateFeeReceipt(receipt: FeeReceipt): void {
    const index = this.data.findIndex((it) => it.id === receipt.id);
    if (index !== -1) {
      this.data[index] = receipt;
    }
  }

  deleteFeeReceipt(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
