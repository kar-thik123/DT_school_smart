import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Vehicle } from './vehicles.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private httpClient = inject(HttpClient);
  private staticData: any[] = [
    {
      id: 1,
      vehicle_no: 'VH-2021-001',
      vehicle_model: 'Toyota Coaster',
      year_made: '2021',
      driver_name: 'John Doe',
      driver_license: 'DL-54321',
      vehicle_type: 'Bus',
      status: 'Active',
      img: 'assets/images/user/user1.jpg',
    },
    {
      id: 2,
      vehicle_no: 'VH-2020-002',
      vehicle_model: 'Mercedes-Benz Sprinter',
      year_made: '2020',
      driver_name: 'Robert Smith',
      driver_license: 'DL-65432',
      vehicle_type: 'Van',
      status: 'Active',
      img: 'assets/images/user/user2.jpg',
    },
    {
      id: 3,
      vehicle_no: 'VH-2019-003',
      vehicle_model: 'Tata Marcopolo',
      year_made: '2019',
      driver_name: 'Michael Brown',
      driver_license: 'DL-76543',
      vehicle_type: 'Bus',
      status: 'Under Maintenance',
      img: 'assets/images/user/user3.jpg',
    },
    {
      id: 4,
      vehicle_no: 'VH-2022-004',
      vehicle_model: 'Ford Transit',
      year_made: '2022',
      driver_name: 'William Wilson',
      driver_license: 'DL-87654',
      vehicle_type: 'Van',
      status: 'Active',
      img: 'assets/images/user/user4.jpg',
    },
    {
      id: 5,
      vehicle_no: 'VH-2021-005',
      vehicle_model: 'Toyota Hiace',
      year_made: '2021',
      driver_name: 'James Davis',
      driver_license: 'DL-98765',
      vehicle_type: 'Van',
      status: 'Inactive',
      img: 'assets/images/user/user5.jpg',
    },
    {
      id: 6,
      vehicle_no: 'VH-2018-006',
      vehicle_model: 'Ashok Leyland Falcon',
      year_made: '2018',
      driver_name: 'Richard Miller',
      driver_license: 'DL-10987',
      vehicle_type: 'Bus',
      status: 'Active',
      img: 'assets/images/user/user6.jpg',
    },
    {
      id: 7,
      vehicle_no: 'VH-2023-007',
      vehicle_model: 'Isuzu NPR',
      year_made: '2023',
      driver_name: 'Joseph Taylor',
      driver_license: 'DL-21098',
      vehicle_type: 'Bus',
      status: 'Active',
      img: 'assets/images/user/user7.jpg',
    },
    {
      id: 8,
      vehicle_no: 'VH-2020-008',
      vehicle_model: 'Volkswagen Crafter',
      year_made: '2020',
      driver_name: 'Thomas Anderson',
      driver_license: 'DL-32109',
      vehicle_type: 'Van',
      status: 'Active',
      img: 'assets/images/user/user8.jpg',
    },
    {
      id: 9,
      vehicle_no: 'VH-2017-009',
      vehicle_model: 'Mitsubishi Rosa',
      year_made: '2017',
      driver_name: 'Charles Moore',
      driver_license: 'DL-43210',
      vehicle_type: 'Bus',
      status: 'Active',
      img: 'assets/images/user/user9.jpg',
    },
    {
      id: 10,
      vehicle_no: 'VH-2021-010',
      vehicle_model: 'Nissan Urvan',
      year_made: '2021',
      driver_name: 'Christopher Jackson',
      driver_license: 'DL-54321',
      vehicle_type: 'Van',
      status: 'Active',
      img: 'assets/images/user/user10.jpg',
    },
    {
      id: 11,
      vehicle_no: 'VH-2022-011',
      vehicle_model: 'Hyundai County',
      year_made: '2022',
      driver_name: 'Daniel White',
      driver_license: 'DL-65432',
      vehicle_type: 'Bus',
      status: 'Active',
      img: 'assets/images/user/user11.jpg',
    },
    {
      id: 12,
      vehicle_no: 'VH-2019-012',
      vehicle_model: 'Ford E-Series',
      year_made: '2019',
      driver_name: 'Matthew Harris',
      driver_license: 'DL-76543',
      vehicle_type: 'Van',
      status: 'Active',
      img: 'assets/images/user/user6.jpg',
    },
  ];

  dataChange: BehaviorSubject<Vehicle[]> = new BehaviorSubject<Vehicle[]>([]);

  get data(): Vehicle[] {
    return this.dataChange.value;
  }

  getVehicles(): Observable<Vehicle[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addVehicle(vehicle: Vehicle): Observable<Vehicle> {
    this.staticData.push(vehicle);
    this.dataChange.next(this.staticData);
    return of(vehicle);
  }

  updateVehicle(vehicle: Vehicle): Observable<Vehicle> {
    const index = this.staticData.findIndex((it) => it.id === vehicle.id);
    if (index !== -1) {
      this.staticData[index] = vehicle;
      this.dataChange.next(this.staticData);
    }
    return of(vehicle);
  }

  deleteVehicle(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
