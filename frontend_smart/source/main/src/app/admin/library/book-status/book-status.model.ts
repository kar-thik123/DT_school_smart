import { formatDate } from '@angular/common';

export class BookStatus {
  bookStatusID: number;
  bookID: number;
  bookName: string;
  status: string;
  dateUpdated: string;
  lastCheckedOutDate: string;
  dueDate: string;
  checkedOutBy: string;
  reservedBy: string;
  condition: string;
  returnDate: string;
  notes: string;

  constructor(bookStatusData: Partial<BookStatus> = {}) {
    this.bookStatusID = bookStatusData.bookStatusID || this.getRandomID();
    this.bookID = bookStatusData.bookID || 0;
    this.bookName = bookStatusData.bookName || '';
    this.status = bookStatusData.status || 'Available';
    this.dateUpdated =
      bookStatusData.dateUpdated || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.lastCheckedOutDate =
      bookStatusData.lastCheckedOutDate ||
      formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.dueDate =
      bookStatusData.dueDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.checkedOutBy = bookStatusData.checkedOutBy || '';
    this.reservedBy = bookStatusData.reservedBy || '';
    this.condition = bookStatusData.condition || 'Good';
    this.returnDate =
      bookStatusData.returnDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.notes = bookStatusData.notes || '';
  }

  // Optional: Method to generate a random ID if needed
  public getRandomID(): number {
    return Math.floor(Math.random() * 1000000);
  }
}
