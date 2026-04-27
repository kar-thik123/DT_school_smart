import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { OnlinePayment } from './online-payment.model';

@Injectable({
  providedIn: 'root',
})
export class OnlinePaymentService {
  private readonly data: OnlinePayment[] = [
    { id: 1, transactionId: 'TXN-782341', feeType: 'Tuition Fee', paymentDate: '2025-01-08', amount: 5000, paymentGateway: 'Stripe', status: 'Success' },
    { id: 2, transactionId: 'TXN-782342', feeType: 'Library Fee', paymentDate: '2025-01-15', amount: 500, paymentGateway: 'PayPal', status: 'Success' },
    { id: 3, transactionId: 'TXN-782343', feeType: 'Transport Fee', paymentDate: '2025-01-02', amount: 2000, paymentGateway: 'Stripe', status: 'Success' },
    { id: 4, transactionId: 'TXN-782344', feeType: 'Hostel Fee', paymentDate: '2025-01-12', amount: 4000, paymentGateway: 'Razorpay', status: 'Success' },
    { id: 5, transactionId: 'TXN-782345', feeType: 'Uniform Fee', paymentDate: '2025-01-22', amount: 3000, paymentGateway: 'Stripe', status: 'Success' },
    { id: 6, transactionId: 'TXN-782346', feeType: 'Lab Fee', paymentDate: '2025-02-25', amount: 1500, paymentGateway: 'PayPal', status: 'Success' },
    { id: 7, transactionId: 'TXN-782347', feeType: 'Activity Fee', paymentDate: '2025-03-01', amount: 1200, paymentGateway: 'Razorpay', status: 'Success' },
    { id: 8, transactionId: 'TXN-782348', feeType: 'Insurance Fee', paymentDate: '2025-01-18', amount: 2500, paymentGateway: 'Stripe', status: 'Success' },
    { id: 9, transactionId: 'TXN-782349', feeType: 'Exam Fee', paymentDate: '2025-02-10', amount: 1000, paymentGateway: 'PayPal', status: 'Failed' },
    { id: 10, transactionId: 'TXN-782350', feeType: 'Tuition Fee', paymentDate: '2025-04-05', amount: 5000, paymentGateway: 'Stripe', status: 'Pending' },
    { id: 11, transactionId: 'TXN-782351', feeType: 'Miscellaneous Fee', paymentDate: '2025-05-10', amount: 800, paymentGateway: 'Razorpay', status: 'Success' },
    { id: 12, transactionId: 'TXN-782352', feeType: 'Sports Fee', paymentDate: '2025-04-08', amount: 300, paymentGateway: 'Stripe', status: 'Refunded' },
  ];

  dataChange: BehaviorSubject<OnlinePayment[]> = new BehaviorSubject<OnlinePayment[]>([]);

  constructor() {}

  get dataItems(): OnlinePayment[] {
    return this.dataChange.value;
  }

  getAllOnlinePayments(): Observable<OnlinePayment[]> {
    return of(this.data);
  }

  addOnlinePayment(payment: OnlinePayment): void {
    this.data.unshift(payment);
  }

  updateOnlinePayment(payment: OnlinePayment): void {
    const index = this.data.findIndex((it) => it.id === payment.id);
    if (index !== -1) {
      this.data[index] = payment;
    }
  }

  deleteOnlinePayment(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
