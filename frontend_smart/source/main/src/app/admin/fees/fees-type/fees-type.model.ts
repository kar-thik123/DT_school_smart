import { formatDate } from '@angular/common';

export class FeesType {
  feeTypeId: number;
  feeTypeName: string;
  category: string;
  description: string;
  amount: number;
  applicableClasses: string;
  frequency: string;
  status: string;
  createdBy: string;
  createdDate: string;
  lastUpdated: string;

  constructor(feeTypeData: Partial<FeesType> = {}) {
    this.feeTypeId = feeTypeData.feeTypeId || this.getRandomID();
    this.feeTypeName = feeTypeData.feeTypeName || '';
    this.category = feeTypeData.category || '';
    this.description = feeTypeData.description || '';
    this.amount = feeTypeData.amount || 0;
    this.applicableClasses = feeTypeData.applicableClasses || '';
    this.frequency = feeTypeData.frequency || '';
    this.status = feeTypeData.status || 'Active';
    this.createdBy = feeTypeData.createdBy || '';
    this.createdDate =
      feeTypeData.createdDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.lastUpdated =
      feeTypeData.lastUpdated || formatDate(new Date(), 'yyyy-MM-dd', 'en');
  }

  // Optional: Method to generate a random ID if needed
  public getRandomID(): number {
    return Math.floor(Math.random() * 1000000);
  }
}
