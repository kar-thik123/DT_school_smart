export class Driver {
  id: number;
  driver_name: string;
  license_no: string;
  phone: string;
  joining_date: string;
  address: string;
  experience: string;
  status: string;
  img: string;

  constructor(driver: Driver) {
    this.id = driver.id || this.getRandomID();
    this.driver_name = driver.driver_name || '';
    this.license_no = driver.license_no || '';
    this.phone = driver.phone || '';
    this.joining_date = driver.joining_date || '';
    this.address = driver.address || '';
    this.experience = driver.experience || '';
    this.status = driver.status || '';
    this.img = driver.img || 'assets/images/user/user1.jpg';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
