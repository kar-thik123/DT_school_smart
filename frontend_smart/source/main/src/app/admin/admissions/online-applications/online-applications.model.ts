export class OnlineApplication {
  id: number;
  img: string;
  student_name: string;
  application_no: string;
  email: string;
  mobile: string;
  gender: string;
  date_of_birth: string;
  course: string;
  application_date: string;
  payment_status: string;
  application_status: string;

  constructor(onlineApplication: OnlineApplication) {
    this.id = onlineApplication.id || this.getRandomID();
    this.img = onlineApplication.img || 'assets/images/user/new.jpg';
    this.student_name = onlineApplication.student_name || '';
    this.application_no = onlineApplication.application_no || '';
    this.email = onlineApplication.email || '';
    this.mobile = onlineApplication.mobile || '';
    this.gender = onlineApplication.gender || '';
    this.date_of_birth = onlineApplication.date_of_birth || '';
    this.course = onlineApplication.course || '';
    this.application_date = onlineApplication.application_date || '';
    this.payment_status = onlineApplication.payment_status || '';
    this.application_status = onlineApplication.application_status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
