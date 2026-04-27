import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { VehicleDetail } from './vehicle-details.model';

@Injectable({
  providedIn: 'root',
})
export class VehicleDetailsService {
  private data: VehicleDetail[] = [
    { id: 1, vehicleNo: 'BUS-101', vehicleModel: 'Tata Starbus', driverName: 'John Doe', driverContact: '9876543210', vehicleType: 'Bus', capacity: 50 },
    { id: 2, vehicleNo: 'BUS-102', vehicleModel: 'Ashok Leyland', driverName: 'James Smith', driverContact: '9876543211', vehicleType: 'Bus', capacity: 45 },
    { id: 3, vehicleNo: 'VAN-201', vehicleModel: 'Force Traveller', driverName: 'Robert Wilson', driverContact: '9876543212', vehicleType: 'Van', capacity: 15 },
    { id: 4, vehicleNo: 'VAN-202', vehicleModel: 'Mahindra TUV', driverName: 'Michael Brown', driverContact: '9876543213', vehicleType: 'Van', capacity: 12 },
    { id: 5, vehicleNo: 'BUS-103', vehicleModel: 'Swaraj Mazda', driverName: 'David Miller', driverContact: '9876543214', vehicleType: 'Bus', capacity: 40 },
    { id: 6, vehicleNo: 'BUS-104', vehicleModel: 'Tata CityRide', driverName: 'Richard Davis', driverContact: '9876543215', vehicleType: 'Bus', capacity: 35 },
    { id: 7, vehicleNo: 'VAN-203', vehicleModel: 'Maruti Eeco', driverName: 'Joseph Garcia', driverContact: '9876543216', vehicleType: 'Van', capacity: 8 },
    { id: 8, vehicleNo: 'VAN-204', vehicleModel: 'Force Urbania', driverName: 'Thomas Rodriguez', driverContact: '9876543217', vehicleType: 'Van', capacity: 18 },
    { id: 9, vehicleNo: 'BUS-105', vehicleModel: 'Eicher Skyline', driverName: 'Charles Martinez', driverContact: '9876543218', vehicleType: 'Bus', capacity: 55 },
    { id: 10, vehicleNo: 'BUS-106', vehicleModel: 'Volvo 9400', driverName: 'Christopher Hernandez', driverContact: '9876543219', vehicleType: 'Bus', capacity: 60 },
    { id: 11, vehicleNo: 'VAN-205', vehicleModel: 'Toyota Hiace', driverName: 'Daniel Lopez', driverContact: '9876543220', vehicleType: 'Van', capacity: 14 },
    { id: 12, vehicleNo: 'VAN-206', vehicleModel: 'Nissan Urvan', driverName: 'Matthew Gonzalez', driverContact: '9876543221', vehicleType: 'Van', capacity: 16 },
  ];

  getAllVehicles(): Observable<VehicleDetail[]> {
    return of(this.data);
  }

  addVehicle(vehicle: VehicleDetail): Observable<VehicleDetail> {
    vehicle.id = Math.max(...this.data.map((v) => v.id)) + 1;
    this.data.unshift(vehicle);
    return of(vehicle);
  }

  updateVehicle(vehicle: VehicleDetail): Observable<VehicleDetail> {
    const index = this.data.findIndex((v) => v.id === vehicle.id);
    if (index !== -1) {
      this.data[index] = vehicle;
    }
    return of(vehicle);
  }

  deleteVehicle(id: number): Observable<boolean> {
    this.data = this.data.filter((v) => v.id !== id);
    return of(true);
  }
}
