export class HallAllocation {
  id: number;
  exam_name: string;
  student_name: string;
  roll_no: string;
  hall_no: string;
  seat_no: string;

  constructor(hallAllocation: HallAllocation) {
    {
      this.id = hallAllocation.id || this.getRandomID();
      this.exam_name = hallAllocation.exam_name || '';
      this.student_name = hallAllocation.student_name || '';
      this.roll_no = hallAllocation.roll_no || '';
      this.hall_no = hallAllocation.hall_no || '';
      this.seat_no = hallAllocation.seat_no || '';
    }
  }
  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
