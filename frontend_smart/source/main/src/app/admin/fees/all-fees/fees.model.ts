import { formatDate } from '@angular/common';

export class Fees {
  id: number;
  rollNo: string;
  studentName: string;
  class: string;
  feesType: string;
  invoiceNo: string;
  paymentDueDate: string;
  paymentDate: string;
  paymentType: string;
  status: string;
  amount: string;
  lateFee: string;
  discount: string;
  createdAt: string;
  updatedAt: string;
  notes: string;

  constructor(fees: Partial<Fees>) {
    this.id = fees.id || this.getRandomID();
    this.rollNo = fees.rollNo || '';
    this.studentName = fees.studentName || '';
    this.class = fees.class || 'N/A';
    this.feesType = fees.feesType || '';
    this.invoiceNo = fees.invoiceNo || '';
    this.paymentDueDate =
      fees.paymentDueDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.paymentDate = fees.paymentDate || '';
    this.paymentType = fees.paymentType || '';
    this.status = fees.status || '';
    this.amount = fees.amount || '';
    this.lateFee = fees.lateFee || '0$';
    this.discount = fees.discount || '0$';
    this.createdAt =
      fees.createdAt || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.updatedAt =
      fees.updatedAt || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.notes = fees.notes || 'N/A';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
