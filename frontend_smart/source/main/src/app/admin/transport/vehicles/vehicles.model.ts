export class Vehicle {
  id: number;
  vehicle_no: string;
  vehicle_model: string;
  year_made: string;
  driver_name: string;
  driver_license: string;
  vehicle_type: string;
  status: string;
  img: string;

  constructor(vehicle: Vehicle) {
    this.id = vehicle.id || this.getRandomID();
    this.vehicle_no = vehicle.vehicle_no || '';
    this.vehicle_model = vehicle.vehicle_model || '';
    this.year_made = vehicle.year_made || '';
    this.driver_name = vehicle.driver_name || '';
    this.driver_license = vehicle.driver_license || '';
    this.vehicle_type = vehicle.vehicle_type || '';
    this.status = vehicle.status || '';
    this.img = vehicle.img || 'assets/images/user/user1.jpg';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
