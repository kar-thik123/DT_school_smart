import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Allocation } from './allocations.model';

@Injectable({
  providedIn: 'root',
})
export class AllocationService {
  private readonly allocations: Allocation[] = [
    new Allocation({
      id: 1,
      img: 'assets/images/user/user1.jpg',
      student_name: 'John Doe',
      roll_no: 'STU001',
      hostel_name: 'Sunrise Hostel',
      room_no: '101',
      room_type: 'Single',
      allocation_date: '2025-01-10',
      status: 'Active',
    }),
    new Allocation({
      id: 2,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Jane Smith',
      roll_no: 'STU002',
      hostel_name: 'Sunrise Hostel',
      room_no: '102',
      room_type: 'Double',
      allocation_date: '2025-01-12',
      status: 'Active',
    }),
    new Allocation({
      id: 3,
      img: 'assets/images/user/user3.jpg',
      student_name: 'Robert Brown',
      roll_no: 'STU003',
      hostel_name: 'Sunset Villa',
      room_no: '201',
      room_type: 'Triple',
      allocation_date: '2025-01-15',
      status: 'Inactive',
    }),
    new Allocation({
      id: 4,
      img: 'assets/images/user/user4.jpg',
      student_name: 'Emily Davis',
      roll_no: 'STU004',
      hostel_name: 'Sunset Villa',
      room_no: '202',
      room_type: 'Single',
      allocation_date: '2025-01-18',
      status: 'Active',
    }),
    new Allocation({
      id: 5,
      img: 'assets/images/user/user5.jpg',
      student_name: 'Michael Wilson',
      roll_no: 'STU005',
      hostel_name: 'Sunrise Hostel',
      room_no: '103',
      room_type: 'Double',
      allocation_date: '2025-01-20',
      status: 'Active',
    }),
    new Allocation({
      id: 6,
      img: 'assets/images/user/user6.jpg',
      student_name: 'Sarah Parker',
      roll_no: 'STU006',
      hostel_name: 'Sunrise Hostel',
      room_no: '104',
      room_type: 'Single',
      allocation_date: '2025-01-22',
      status: 'Active',
    }),
    new Allocation({
      id: 7,
      img: 'assets/images/user/user7.jpg',
      student_name: 'David Lee',
      roll_no: 'STU007',
      hostel_name: 'Sunset Villa',
      room_no: '203',
      room_type: 'Double',
      allocation_date: '2025-01-25',
      status: 'Active',
    }),
    new Allocation({
      id: 8,
      img: 'assets/images/user/user8.jpg',
      student_name: 'Emma Watson',
      roll_no: 'STU008',
      hostel_name: 'Sunset Villa',
      room_no: '204',
      room_type: 'Triple',
      allocation_date: '2025-01-28',
      status: 'Inactive',
    }),
    new Allocation({
      id: 9,
      img: 'assets/images/user/user9.jpg',
      student_name: 'Chris Evans',
      roll_no: 'STU009',
      hostel_name: 'Sunrise Hostel',
      room_no: '105',
      room_type: 'Single',
      allocation_date: '2025-02-01',
      status: 'Active',
    }),
    new Allocation({
      id: 10,
      img: 'assets/images/user/user10.jpg',
      student_name: 'Jessica Alba',
      roll_no: 'STU010',
      hostel_name: 'Sunset Villa',
      room_no: '205',
      room_type: 'Double',
      allocation_date: '2025-02-05',
      status: 'Active',
    }),
    new Allocation({
      id: 11,
      img: 'assets/images/user/user11.jpg',
      student_name: 'Tom Cruise',
      roll_no: 'STU011',
      hostel_name: 'Sunrise Hostel',
      room_no: '106',
      room_type: 'Triple',
      allocation_date: '2025-02-10',
      status: 'Active',
    }),
    new Allocation({
      id: 12,
      img: 'assets/images/user/user1.jpg',
      student_name: 'Will Smith',
      roll_no: 'STU012',
      hostel_name: 'Sunset Villa',
      room_no: '206',
      room_type: 'Single',
      allocation_date: '2025-02-15',
      status: 'Active',
    }),
  ];

  dataChange: BehaviorSubject<Allocation[]> = new BehaviorSubject<Allocation[]>([]);

  /** GET: Fetch all allocations */
  getAllAllocations(): Observable<Allocation[]> {
    this.dataChange.next(this.allocations);
    return of(this.allocations);
  }

  /** POST: Add a new allocation */
  addAllocation(allocation: Allocation): Observable<Allocation> {
    this.allocations.unshift(allocation);
    this.dataChange.next(this.allocations);
    return of(allocation);
  }

  /** PUT: Update an existing allocation */
  updateAllocation(allocation: Allocation): Observable<Allocation> {
    const index = this.allocations.findIndex((it) => it.id === allocation.id);
    if (index !== -1) {
      this.allocations[index] = allocation;
      this.dataChange.next(this.allocations);
    }
    return of(allocation);
  }

  /** DELETE: Remove an allocation by ID */
  deleteAllocation(id: number): Observable<number> {
    const index = this.allocations.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.allocations.splice(index, 1);
      this.dataChange.next(this.allocations);
    }
    return of(id);
  }
}
