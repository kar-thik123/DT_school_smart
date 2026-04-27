import { formatDate } from '@angular/common';

export class Allocation {
  id: number;
  img: string;
  student_name: string;
  roll_no: string;
  hostel_name: string;
  room_no: string;
  room_type: string;
  allocation_date: string;
  status: string;

  constructor(allocation: Partial<Allocation> = {}) {
    this.id = allocation.id || this.getRandomID();
    this.img = allocation.img || 'assets/images/user/new.jpg';
    this.student_name = allocation.student_name || '';
    this.roll_no = allocation.roll_no || '';
    this.hostel_name = allocation.hostel_name || '';
    this.room_no = allocation.room_no || '';
    this.room_type = allocation.room_type || '';
    this.allocation_date = allocation.allocation_date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.status = allocation.status || 'Active';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
