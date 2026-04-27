import { formatDate } from '@angular/common';

export class AllHoliday {
  id: number;
  holidayName: string;
  shift: string;
  details: string;
  date: string;
  location: string;
  holidayType: string;
  createdBy: string;
  creationDate: string;
  approvalStatus: string;

  constructor(holiday: Partial<AllHoliday>) {
    this.id = holiday.id || this.getRandomID();
    this.holidayName = holiday.holidayName || '';
    this.shift = holiday.shift || '';
    this.details = holiday.details || '';
    this.date = holiday.date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.location = holiday.location || '';
    this.holidayType = holiday.holidayType || '';
    this.createdBy = holiday.createdBy || '';
    this.creationDate =
      holiday.creationDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.approvalStatus = holiday.approvalStatus || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
