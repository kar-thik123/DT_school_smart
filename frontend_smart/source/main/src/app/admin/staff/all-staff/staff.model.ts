import { formatDate } from '@angular/common';

export class Staff {
  id: string;
  img: string;
  name: string;
  email: string;
  address: string;
  mobile: string;
  department: string;
  status: string;
  joining_date: string;
  salary: string;
  experience: string;
  role: string;
  date_of_birth: string;
  gender: string;

  constructor(staff: Partial<Staff>) {
    // Use Partial to allow optional fields
    this.id = staff.id || this.getRandomID();
    this.img = staff.img || 'assets/images/user/new.jpg';
    this.name = staff.name || '';
    this.email = staff.email || '';
    this.address = staff.address || '';
    this.mobile = staff.mobile || '';
    this.department = staff.department || '';
    this.status = staff.status || 'Active';
    this.joining_date =
      staff.joining_date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.salary = staff.salary || '0';
    this.experience = staff.experience || '0 years';
    this.role = staff.role || '';
    this.date_of_birth =
      staff.date_of_birth || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.gender = staff.gender || '';
  }

  public getRandomID(): string {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4().toString() + S4().toString();
  }
}
