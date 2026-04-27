import { formatDate } from '@angular/common';

export class Teachers {
  id: number;
  img: string;
  name: string;
  email: string;
  gender: string;
  mobile: string;
  department: string;
  degree: string;
  address: string;
  hire_date: string;
  salary: string;
  subject_specialization: string;
  experience_years: number;
  status: string;
  birthdate: string;
  bio: string;

  constructor(teachers: Partial<Teachers>) {
    this.id = teachers.id || this.getRandomID();
    this.img = teachers.img || 'assets/images/user/new.jpg';
    this.name = teachers.name || '';
    this.email = teachers.email || '';
    this.hire_date =
      teachers.hire_date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.gender = teachers.gender || '';
    this.mobile = teachers.mobile || '';
    this.department = teachers.department || '';
    this.degree = teachers.degree || '';
    this.address = teachers.address || '';
    this.salary = teachers.salary || '0'; // Default salary
    this.subject_specialization = teachers.subject_specialization || '';
    this.experience_years = teachers.experience_years || 0; // Default experience years
    this.status = teachers.status || 'active'; // Default status
    this.birthdate = teachers.birthdate || '';
    this.bio = teachers.bio || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
