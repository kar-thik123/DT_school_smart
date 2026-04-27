import { formatDate } from '@angular/common';

export class AllAssets {
  id: number;
  no: string;
  title: string;
  subject: string;
  purchase_date: string;
  department: string;
  type: string;
  status: string;
  last_borrowed: string | '';
  borrower_name: string | '';
  due_date: string | '';
  shelf_location: string;

  constructor(allAssets: Partial<AllAssets>) {
    this.id = allAssets.id || this.getRandomID();
    this.no = allAssets.no || '';
    this.title = allAssets.title || '';
    this.subject = allAssets.subject || '';
    this.purchase_date =
      allAssets.purchase_date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.department = allAssets.department || '';
    this.type = allAssets.type || '';
    this.status = allAssets.status || '';
    this.last_borrowed = allAssets.last_borrowed || '';
    this.borrower_name = allAssets.borrower_name || '';
    this.due_date = allAssets.due_date || '';
    this.shelf_location = allAssets.shelf_location || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
