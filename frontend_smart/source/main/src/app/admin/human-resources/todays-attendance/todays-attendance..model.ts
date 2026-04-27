export class TodaysAttendance {
  id: number;
  img: string;
  name: string;
  first_in: string;
  break: string;
  last_out: string;
  total: string;
  status: string;
  shift: string;

  constructor(todaysAttendance: TodaysAttendance) {
    {
      this.id = todaysAttendance.id || this.getRandomID();
      this.img = todaysAttendance.img || 'assets/images/user/new.jpg';
      this.name = todaysAttendance.name || '';
      this.first_in = todaysAttendance.first_in || '';
      this.break = todaysAttendance.break || '';
      this.last_out = todaysAttendance.last_out || '';
      this.total = todaysAttendance.total || '';
      this.status = todaysAttendance.status || '';
      this.shift = todaysAttendance.shift || '';
    }
  }
  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
