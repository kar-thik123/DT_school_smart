export class TransportFee {
  id: number;
  student_name: string;
  student_id: string;
  class_section: string;
  route_name: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  status: string;
  img: string;

  constructor(fee: TransportFee) {
    this.id = fee.id || this.getRandomID();
    this.student_name = fee.student_name || '';
    this.student_id = fee.student_id || '';
    this.class_section = fee.class_section || '';
    this.route_name = fee.route_name || '';
    this.amount = fee.amount || '';
    this.payment_date = fee.payment_date || '';
    this.payment_method = fee.payment_method || '';
    this.status = fee.status || '';
    this.img = fee.img || 'assets/images/user/user1.jpg';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
