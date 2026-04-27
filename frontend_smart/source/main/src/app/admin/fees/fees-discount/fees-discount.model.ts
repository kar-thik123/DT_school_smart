import { formatDate } from '@angular/common';

export class FeesDiscount {
  discountId: number;
  discountType: string;
  discountAmount: number;
  discountPercentage: number;
  discountCode: string;
  startDate: string;
  endDate: string;
  appliedDate: string;
  status: string;
  remarks: string;

  constructor(discountData: Partial<FeesDiscount> = {}) {
    this.discountId = discountData.discountId || this.getRandomID();
    this.discountType = discountData.discountType || '';
    this.discountAmount = discountData.discountAmount || 0;
    this.discountPercentage = discountData.discountPercentage || 0;
    this.discountCode = discountData.discountCode || '';
    this.startDate =
      discountData.startDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.endDate =
      discountData.endDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.appliedDate =
      discountData.appliedDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.status = discountData.status || 'Active';
    this.remarks = discountData.remarks || '';
  }

  // Optional: Method to generate a random ID if needed
  public getRandomID(): number {
    return Math.floor(Math.random() * 1000000);
  }
}
