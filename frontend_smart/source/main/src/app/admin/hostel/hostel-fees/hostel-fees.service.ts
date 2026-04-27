import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HostelFee } from './hostel-fees.model';

@Injectable({
  providedIn: 'root',
})
export class HostelFeesService {
  private readonly hostelFees: HostelFee[] = [
    new HostelFee({
      id: 1,
      img: 'assets/images/user/user1.jpg',
      student_name: 'John Doe',
      roll_no: '101',
      hostel_name: 'Sunrise Hostel',
      room_no: '101',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-01-05',
      payment_status: 'Paid',
    }),
    new HostelFee({
      id: 2,
      img: 'assets/images/user/user2.jpg',
      student_name: 'Jane Smith',
      roll_no: '102',
      hostel_name: 'Sunrise Hostel',
      room_no: '102',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-01-06',
      payment_status: 'Unpaid',
    }),
    new HostelFee({
      id: 3,
      img: 'assets/images/user/user3.jpg',
      student_name: 'Robert Brown',
      roll_no: '103',
      hostel_name: 'Sunset Villa',
      room_no: '201',
      fee_type: 'Quarterly',
      amount: 4000,
      payment_date: '2025-01-10',
      payment_status: 'Paid',
    }),
    new HostelFee({
      id: 4,
      img: 'assets/images/user/user4.jpg',
      student_name: 'Emily Davis',
      roll_no: '104',
      hostel_name: 'Sunset Villa',
      room_no: '202',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-01-12',
      payment_status: 'Paid',
    }),
    new HostelFee({
      id: 5,
      img: 'assets/images/user/user5.jpg',
      student_name: 'Michael Wilson',
      roll_no: '105',
      hostel_name: 'Sunrise Hostel',
      room_no: '103',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-01-15',
      payment_status: 'Unpaid',
    }),
    new HostelFee({
      id: 6,
      img: 'assets/images/user/user6.jpg',
      student_name: 'Sarah Parker',
      roll_no: '106',
      hostel_name: 'Sunrise Hostel',
      room_no: '104',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-01-18',
      payment_status: 'Paid',
    }),
    new HostelFee({
      id: 7,
      img: 'assets/images/user/user7.jpg',
      student_name: 'David Lee',
      roll_no: '107',
      hostel_name: 'Sunset Villa',
      room_no: '203',
      fee_type: 'Yearly',
      amount: 15000,
      payment_date: '2025-01-20',
      payment_status: 'Paid',
    }),
    new HostelFee({
      id: 8,
      img: 'assets/images/user/user8.jpg',
      student_name: 'Emma Watson',
      roll_no: '108',
      hostel_name: 'Sunset Villa',
      room_no: '204',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-01-22',
      payment_status: 'Unpaid',
    }),
    new HostelFee({
      id: 9,
      img: 'assets/images/user/user9.jpg',
      student_name: 'Chris Evans',
      roll_no: '109',
      hostel_name: 'Sunrise Hostel',
      room_no: '105',
      fee_type: 'Quarterly',
      amount: 4000,
      payment_date: '2025-01-25',
      payment_status: 'Paid',
    }),
    new HostelFee({
      id: 10,
      img: 'assets/images/user/user10.jpg',
      student_name: 'Jessica Alba',
      roll_no: '110',
      hostel_name: 'Sunset Villa',
      room_no: '205',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-01-28',
      payment_status: 'Paid',
    }),
    new HostelFee({
      id: 11,
      img: 'assets/images/user/user11.jpg',
      student_name: 'Tom Cruise',
      roll_no: '111',
      hostel_name: 'Sunrise Hostel',
      room_no: '106',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-02-01',
      payment_status: 'Unpaid',
    }),
    new HostelFee({
      id: 12,
      img: 'assets/images/user/user1.jpg',
      student_name: 'Will Smith',
      roll_no: '112',
      hostel_name: 'Sunset Villa',
      room_no: '206',
      fee_type: 'Monthly',
      amount: 1500,
      payment_date: '2025-02-05',
      payment_status: 'Paid',
    }),
  ];

  dataChange: BehaviorSubject<HostelFee[]> = new BehaviorSubject<HostelFee[]>([]);

  /** GET: Fetch all fee records */
  getAllFees(): Observable<HostelFee[]> {
    this.dataChange.next(this.hostelFees);
    return of(this.hostelFees);
  }

  /** POST: Add a new fee record */
  addFee(fee: HostelFee): Observable<HostelFee> {
    this.hostelFees.unshift(fee);
    this.dataChange.next(this.hostelFees);
    return of(fee);
  }

  /** PUT: Update an existing fee record */
  updateFee(fee: HostelFee): Observable<HostelFee> {
    const index = this.hostelFees.findIndex((it) => it.id === fee.id);
    if (index !== -1) {
      this.hostelFees[index] = fee;
      this.dataChange.next(this.hostelFees);
    }
    return of(fee);
  }

  /** DELETE: Remove a fee record by ID */
  deleteFee(id: number): Observable<number> {
    const index = this.hostelFees.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.hostelFees.splice(index, 1);
      this.dataChange.next(this.hostelFees);
    }
    return of(id);
  }
}
