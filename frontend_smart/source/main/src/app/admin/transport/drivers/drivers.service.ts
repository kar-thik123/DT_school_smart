import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Driver } from './drivers.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DriverService {
  private httpClient = inject(HttpClient);
  private staticData: any[] = [
    {
      id: 1,
      driver_name: 'John Doe',
      license_no: 'DL-54321',
      phone: '1234567890',
      joining_date: '2021-01-15',
      address: '123 Main St, New York',
      experience: '5 years',
      status: 'Active',
      img: 'assets/images/user/user1.jpg',
    },
    {
      id: 2,
      driver_name: 'Robert Smith',
      license_no: 'DL-65432',
      phone: '2345678901',
      joining_date: '2020-05-20',
      address: '456 Elm St, Chicago',
      experience: '8 years',
      status: 'Active',
      img: 'assets/images/user/user2.jpg',
    },
    {
      id: 3,
      driver_name: 'Michael Brown',
      license_no: 'DL-76543',
      phone: '3456789012',
      joining_date: '2019-11-10',
      address: '789 Oak St, Los Angeles',
      experience: '10 years',
      status: 'Inactive',
      img: 'assets/images/user/user3.jpg',
    },
    {
      id: 4,
      driver_name: 'William Wilson',
      license_no: 'DL-87654',
      phone: '4567890123',
      joining_date: '2022-03-05',
      address: '321 Pine St, Houston',
      experience: '3 years',
      status: 'Active',
      img: 'assets/images/user/user4.jpg',
    },
    {
      id: 5,
      driver_name: 'James Davis',
      license_no: 'DL-98765',
      phone: '5678901234',
      joining_date: '2021-08-12',
      address: '654 Maple St, Phoenix',
      experience: '4 years',
      status: 'Active',
      img: 'assets/images/user/user5.jpg',
    },
    {
      id: 6,
      driver_name: 'Richard Miller',
      license_no: 'DL-10987',
      phone: '6789012345',
      joining_date: '2018-09-25',
      address: '987 Cedar St, Philadelphia',
      experience: '12 years',
      status: 'Active',
      img: 'assets/images/user/user6.jpg',
    },
    {
      id: 7,
      driver_name: 'Joseph Taylor',
      license_no: 'DL-21098',
      phone: '7890123456',
      joining_date: '2023-02-01',
      address: '159 Birch St, San Antonio',
      experience: '2 years',
      status: 'Active',
      img: 'assets/images/user/user7.jpg',
    },
    {
      id: 8,
      driver_name: 'Thomas Anderson',
      license_no: 'DL-32109',
      phone: '8901234567',
      joining_date: '2020-12-10',
      address: '753 Walnut St, San Diego',
      experience: '7 years',
      status: 'Active',
      img: 'assets/images/user/user8.jpg',
    },
    {
      id: 9,
      driver_name: 'Charles Moore',
      license_no: 'DL-43210',
      phone: '9012345678',
      joining_date: '2017-04-18',
      address: '357 Cherry St, Dallas',
      experience: '15 years',
      status: 'Active',
      img: 'assets/images/user/user9.jpg',
    },
    {
      id: 10,
      driver_name: 'Christopher Jackson',
      license_no: 'DL-54321',
      phone: '0123456789',
      joining_date: '2021-06-30',
      address: '951 Ash St, San Jose',
      experience: '6 years',
      status: 'Active',
      img: 'assets/images/user/user10.jpg',
    },
    {
      id: 11,
      driver_name: 'Daniel White',
      license_no: 'DL-65432',
      phone: '1234509876',
      joining_date: '2022-10-15',
      address: '852 Spruce St, Austin',
      experience: '4 years',
      status: 'Active',
      img: 'assets/images/user/user11.jpg',
    },
    {
      id: 12,
      driver_name: 'Matthew Harris',
      license_no: 'DL-76543',
      phone: '2345610987',
      joining_date: '2019-02-28',
      address: '741 Poplar St, Jacksonville',
      experience: '9 years',
      status: 'Active',
      img: 'assets/images/user/user6.jpg',
    },
  ];

  dataChange: BehaviorSubject<Driver[]> = new BehaviorSubject<Driver[]>([]);

  get data(): Driver[] {
    return this.dataChange.value;
  }

  getDrivers(): Observable<Driver[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addDriver(driver: Driver): Observable<Driver> {
    this.staticData.push(driver);
    this.dataChange.next(this.staticData);
    return of(driver);
  }

  updateDriver(driver: Driver): Observable<Driver> {
    const index = this.staticData.findIndex((it) => it.id === driver.id);
    if (index !== -1) {
      this.staticData[index] = driver;
      this.dataChange.next(this.staticData);
    }
    return of(driver);
  }

  deleteDriver(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
