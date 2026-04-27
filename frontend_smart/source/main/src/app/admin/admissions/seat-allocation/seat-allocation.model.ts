export class SeatAllocation {
  id: number;
  student_name: string;
  application_no: string;
  course: string;
  category: string;
  allotted_seat_type: string;
  allocation_date: string;
  reporting_date: string;
  status: string;
  fees_paid: boolean;

  constructor(seatAllocation: SeatAllocation) {
    this.id = seatAllocation.id || this.getRandomID();
    this.student_name = seatAllocation.student_name || '';
    this.application_no = seatAllocation.application_no || '';
    this.course = seatAllocation.course || '';
    this.category = seatAllocation.category || '';
    this.allotted_seat_type = seatAllocation.allotted_seat_type || '';
    this.allocation_date = seatAllocation.allocation_date || '';
    this.reporting_date = seatAllocation.reporting_date || '';
    this.status = seatAllocation.status || '';
    this.fees_paid = seatAllocation.fees_paid || false;
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
