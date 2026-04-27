import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HostelFee } from './hostel-fees.model';

@Injectable({
  providedIn: 'root',
})
export class HostelFeesService {
  private data: HostelFee[] = [
    { id: 1, invoiceNo: 'INV-H001', roomNo: 'H1-101', hostelName: 'Boys Hostel A', feeType: 'Room Rent', amount: 5000, date: '2025-01-05', paymentStatus: 'Paid' },
    { id: 2, invoiceNo: 'INV-H002', roomNo: 'H1-101', hostelName: 'Boys Hostel A', feeType: 'Mess Fee', amount: 2500, date: '2025-01-05', paymentStatus: 'Paid' },
    { id: 3, invoiceNo: 'INV-H003', roomNo: 'H1-102', hostelName: 'Boys Hostel A', feeType: 'Room Rent', amount: 3500, date: '2025-01-10', paymentStatus: 'Unpaid' },
    { id: 4, invoiceNo: 'INV-H004', roomNo: 'H2-201', hostelName: 'Girls Hostel B', feeType: 'Room Rent', amount: 5500, date: '2025-02-01', paymentStatus: 'Paid' },
    { id: 5, invoiceNo: 'INV-H005', roomNo: 'H2-201', hostelName: 'Girls Hostel B', feeType: 'Laundry', amount: 500, date: '2025-02-01', paymentStatus: 'Paid' },
    { id: 6, invoiceNo: 'INV-H006', roomNo: 'H3-301', hostelName: 'Boys Hostel C', feeType: 'Room Rent', amount: 4800, date: '2025-03-15', paymentStatus: 'Unpaid' },
    { id: 7, invoiceNo: 'INV-H007', roomNo: 'H4-402', hostelName: 'Girls Hostel D', feeType: 'Room Rent', amount: 3400, date: '2025-04-20', paymentStatus: 'Paid' },
    { id: 8, invoiceNo: 'INV-H008', roomNo: 'H1-103', hostelName: 'Boys Hostel A', feeType: 'Room Rent', amount: 8000, date: '2025-05-12', paymentStatus: 'Paid' },
    { id: 9, invoiceNo: 'INV-H009', roomNo: 'H1-104', hostelName: 'Boys Hostel A', feeType: 'Room Rent', amount: 3500, date: '2025-06-08', paymentStatus: 'Unpaid' },
    { id: 10, invoiceNo: 'INV-H010', roomNo: 'H2-203', hostelName: 'Girls Hostel B', feeType: 'Room Rent', amount: 8500, date: '2025-07-22', paymentStatus: 'Paid' },
    { id: 11, invoiceNo: 'INV-H011', roomNo: 'H3-302', hostelName: 'Boys Hostel C', feeType: 'Mess Fee', amount: 2200, date: '2025-08-30', paymentStatus: 'Paid' },
    { id: 12, invoiceNo: 'INV-H012', roomNo: 'H4-401', hostelName: 'Girls Hostel D', feeType: 'Room Rent', amount: 5200, date: '2025-09-15', paymentStatus: 'Unpaid' },
  ];

  getAllFees(): Observable<HostelFee[]> {
    return of(this.data);
  }

  addFee(fee: HostelFee): Observable<HostelFee> {
    fee.id = Math.max(...this.data.map((f) => f.id)) + 1;
    this.data.unshift(fee);
    return of(fee);
  }

  updateFee(fee: HostelFee): Observable<HostelFee> {
    const index = this.data.findIndex((f) => f.id === fee.id);
    if (index !== -1) {
      this.data[index] = fee;
    }
    return of(fee);
  }

  deleteFee(id: number): Observable<boolean> {
    this.data = this.data.filter((f) => f.id !== id);
    return of(true);
  }
}
