import { formatDate } from '@angular/common';

export class Holiday {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  type: string;
  description: string;
  location: string;
  created_at: string;
  updated_at: string;
  is_recurring: string;
  status: string;

  constructor(holiday: Partial<Holiday>) {
    this.id = holiday.id || this.getRandomID();
    this.title = holiday.title || '';
    this.start_date =
      holiday.start_date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.end_date =
      holiday.end_date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.type = holiday.type || '';
    this.description = holiday.description || '';
    this.location = holiday.location || 'Global';
    this.created_at =
      holiday.created_at ||
      formatDate(new Date(), 'yyyy-MM-ddTHH:mm:ssZ', 'en');
    this.updated_at =
      holiday.updated_at ||
      formatDate(new Date(), 'yyyy-MM-ddTHH:mm:ssZ', 'en');
    this.is_recurring = holiday.is_recurring || 'No';
    this.status = holiday.status || 'Active';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
