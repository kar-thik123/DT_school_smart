import { formatDate } from '@angular/common';

export class Students {
  id: number;
  img: string;
  name: string;
  email: string;
  gender: string;
  mobile: string;
  department: string;
  rollNo: string;
  date_of_birth: string;
  address: string;
  enrollment_date: string;
  graduation_year: string;
  parent_guardian_name: string;
  parent_guardian_mobile: string;
  status: string;
  profile_completion_status: string;
  scholarship_status: string;

  constructor(students: Partial<Students>) {
    this.id = students.id || this.getRandomID();
    this.img = students.img || 'assets/images/user/new.jpg';
    this.name = students.name || '';
    this.email = students.email || '';
    this.gender = students.gender || '';
    this.mobile = students.mobile || '';
    this.department = students.department || '';
    this.rollNo = students.rollNo || '';
    this.date_of_birth = formatDate(new Date(), 'yyyy-MM-dd', 'en') || '';
    this.address = students.address || '';
    this.enrollment_date = formatDate(new Date(), 'yyyy-MM-dd', 'en') || '';
    this.graduation_year = students.graduation_year || '';
    this.parent_guardian_name = students.parent_guardian_name || '';
    this.parent_guardian_mobile = students.parent_guardian_mobile || '';
    this.status = students.status || 'active'; // Default value
    this.profile_completion_status =
      students.profile_completion_status || 'incomplete'; // Default value
    this.scholarship_status = students.scholarship_status || 'none'; // Default value
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
