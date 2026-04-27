import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { StudentAllocation } from './student-allocation.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StudentAllocationService {
  private httpClient = inject(HttpClient);
  private staticData: any[] = [
    {
      id: 1,
      student_name: 'Alice Johnson',
      student_id: 'STU001',
      class_section: '10-A',
      route_name: 'North Campus - Main Gate',
      vehicle_no: 'VH-2021-001',
      stop_point: 'Blue Circle',
      allocation_date: '2023-08-15',
      status: 'Active',
      img: 'assets/images/user/user1.jpg',
    },
    {
      id: 2,
      student_name: 'Bob Smith',
      student_id: 'STU002',
      class_section: '9-B',
      route_name: 'City Center - South Block',
      vehicle_no: 'VH-2020-002',
      stop_point: 'Green Park',
      allocation_date: '2023-08-16',
      status: 'Active',
      img: 'assets/images/user/user2.jpg',
    },
    {
      id: 3,
      student_name: 'Charlie Brown',
      student_id: 'STU003',
      class_section: '11-C',
      route_name: 'Airport Road - Science Wing',
      vehicle_no: 'VH-2019-003',
      stop_point: 'Red Cross',
      allocation_date: '2023-08-17',
      status: 'Inactive',
      img: 'assets/images/user/user3.jpg',
    },
    {
      id: 4,
      student_name: 'Diana Prince',
      student_id: 'STU004',
      class_section: '8-A',
      route_name: 'Green Valley - Arts College',
      vehicle_no: 'VH-2022-004',
      stop_point: 'Yellow House',
      allocation_date: '2023-08-18',
      status: 'Active',
      img: 'assets/images/user/user4.jpg',
    },
    {
      id: 5,
      student_name: 'Ethan Hunt',
      student_id: 'STU005',
      class_section: '12-B',
      route_name: 'Railway Station - Hostel Block',
      vehicle_no: 'VH-2021-005',
      stop_point: 'Black Square',
      allocation_date: '2023-08-19',
      status: 'Active',
      img: 'assets/images/user/user5.jpg',
    },
    {
      id: 6,
      student_name: 'Fiona Gallagher',
      student_id: 'STU006',
      class_section: '10-B',
      route_name: 'East Suburb - Library',
      vehicle_no: 'VH-2018-006',
      stop_point: 'White Bridge',
      allocation_date: '2023-08-20',
      status: 'Active',
      img: 'assets/images/user/user6.jpg',
    },
    {
      id: 7,
      student_name: 'George Miller',
      student_id: 'STU007',
      class_section: '7-C',
      route_name: 'West End - Sports Complex',
      vehicle_no: 'VH-2023-007',
      stop_point: 'Silver Road',
      allocation_date: '2023-08-21',
      status: 'Active',
      img: 'assets/images/user/user7.jpg',
    },
    {
      id: 8,
      student_name: 'Hannah Abbott',
      student_id: 'STU008',
      class_section: '11-A',
      route_name: 'Hill Top - Medical Center',
      vehicle_no: 'VH-2020-008',
      stop_point: 'Gold Hill',
      allocation_date: '2023-08-22',
      status: 'Active',
      img: 'assets/images/user/user8.jpg',
    },
    {
      id: 9,
      student_name: 'Ian Wright',
      student_id: 'STU009',
      class_section: '9-A',
      route_name: 'Market Square - Admin Block',
      vehicle_no: 'VH-2017-009',
      stop_point: 'Old Market',
      allocation_date: '2023-08-23',
      status: 'Active',
      img: 'assets/images/user/user9.jpg',
    },
    {
      id: 10,
      student_name: 'Julia Roberts',
      student_id: 'STU010',
      class_section: '12-A',
      route_name: 'Lake Side - Engineering Wing',
      vehicle_no: 'VH-2021-010',
      stop_point: 'Water Front',
      allocation_date: '2023-08-24',
      status: 'Active',
      img: 'assets/images/user/user10.jpg',
    },
    {
      id: 11,
      student_name: 'Kevin Hart',
      student_id: 'STU011',
      class_section: '8-B',
      route_name: 'Central Plaza - IT Center',
      vehicle_no: 'VH-2022-011',
      stop_point: 'Main Plaza',
      allocation_date: '2023-08-25',
      status: 'Active',
      img: 'assets/images/user/user11.jpg',
    },
    {
      id: 12,
      student_name: 'Laura Palmer',
      student_id: 'STU012',
      class_section: '10-C',
      route_name: 'Old Town - PG Hostel',
      vehicle_no: 'VH-2019-012',
      stop_point: 'North End',
      allocation_date: '2023-08-26',
      status: 'Active',
      img: 'assets/images/user/user6.jpg',
    },
  ];

  dataChange: BehaviorSubject<StudentAllocation[]> = new BehaviorSubject<
    StudentAllocation[]
  >([]);

  get data(): StudentAllocation[] {
    return this.dataChange.value;
  }

  getAllocations(): Observable<StudentAllocation[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addAllocation(allocation: StudentAllocation): Observable<StudentAllocation> {
    this.staticData.push(allocation);
    this.dataChange.next(this.staticData);
    return of(allocation);
  }

  updateAllocation(
    allocation: StudentAllocation
  ): Observable<StudentAllocation> {
    const index = this.staticData.findIndex((it) => it.id === allocation.id);
    if (index !== -1) {
      this.staticData[index] = allocation;
      this.dataChange.next(this.staticData);
    }
    return of(allocation);
  }

  deleteAllocation(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
