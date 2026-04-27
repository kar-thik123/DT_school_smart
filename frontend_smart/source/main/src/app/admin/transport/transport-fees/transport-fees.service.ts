import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TransportFee } from './transport-fees.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TransportFeeService {
  private httpClient = inject(HttpClient);
  private staticData: any[] = [
    {
      id: 1,
      student_name: 'Alice Johnson',
      student_id: 'STU001',
      class_section: '10-A',
      route_name: 'North Campus - Main Gate',
      amount: '500',
      payment_date: '2023-09-01',
      payment_method: 'Online',
      status: 'Paid',
      img: 'assets/images/user/user1.jpg',
    },
    {
      id: 2,
      student_name: 'Bob Smith',
      student_id: 'STU002',
      class_section: '9-B',
      route_name: 'City Center - South Block',
      amount: '1200',
      payment_date: '2023-09-02',
      payment_method: 'Cash',
      status: 'Paid',
      img: 'assets/images/user/user2.jpg',
    },
    {
      id: 3,
      student_name: 'Charlie Brown',
      student_id: 'STU003',
      class_section: '11-C',
      route_name: 'Airport Road - Science Wing',
      amount: '1500',
      payment_date: '2023-09-03',
      payment_method: 'Online',
      status: 'Unpaid',
      img: 'assets/images/user/user3.jpg',
    },
    {
      id: 4,
      student_name: 'Diana Prince',
      student_id: 'STU004',
      class_section: '8-A',
      route_name: 'Green Valley - Arts College',
      amount: '800',
      payment_date: '2023-09-04',
      payment_method: 'Card',
      status: 'Paid',
      img: 'assets/images/user/user4.jpg',
    },
    {
      id: 5,
      student_name: 'Ethan Hunt',
      student_id: 'STU005',
      class_section: '12-B',
      route_name: 'Railway Station - Hostel Block',
      amount: '1000',
      payment_date: '2023-09-05',
      payment_method: 'Online',
      status: 'Paid',
      img: 'assets/images/user/user5.jpg',
    },
    {
      id: 6,
      student_name: 'Fiona Gallagher',
      student_id: 'STU006',
      class_section: '10-B',
      route_name: 'East Suburb - Library',
      amount: '2000',
      payment_date: '2023-09-06',
      payment_method: 'Cash',
      status: 'Paid',
      img: 'assets/images/user/user6.jpg',
    },
    {
      id: 7,
      student_name: 'George Miller',
      student_id: 'STU007',
      class_section: '7-C',
      route_name: 'West End - Sports Complex',
      amount: '1800',
      payment_date: '2023-09-07',
      payment_method: 'Online',
      status: 'Paid',
      img: 'assets/images/user/user7.jpg',
    },
    {
      id: 8,
      student_name: 'Hannah Abbott',
      student_id: 'STU008',
      class_section: '11-A',
      route_name: 'Hill Top - Medical Center',
      amount: '2500',
      payment_date: '2023-09-08',
      payment_method: 'Card',
      status: 'Paid',
      img: 'assets/images/user/user8.jpg',
    },
    {
      id: 9,
      student_name: 'Ian Wright',
      student_id: 'STU009',
      class_section: '9-A',
      route_name: 'Market Square - Admin Block',
      amount: '600',
      payment_date: '2023-09-09',
      payment_method: 'Online',
      status: 'Unpaid',
      img: 'assets/images/user/user9.jpg',
    },
    {
      id: 10,
      student_name: 'Julia Roberts',
      student_id: 'STU010',
      class_section: '12-A',
      route_name: 'Lake Side - Engineering Wing',
      amount: '1400',
      payment_date: '2023-09-10',
      payment_method: 'Cash',
      status: 'Paid',
      img: 'assets/images/user/user10.jpg',
    },
    {
      id: 11,
      student_name: 'Kevin Hart',
      student_id: 'STU011',
      class_section: '8-B',
      route_name: 'Central Plaza - IT Center',
      amount: '700',
      payment_date: '2023-09-11',
      payment_method: 'Online',
      status: 'Paid',
      img: 'assets/images/user/user11.jpg',
    },
    {
      id: 12,
      student_name: 'Laura Palmer',
      student_id: 'STU012',
      class_section: '10-C',
      route_name: 'Old Town - PG Hostel',
      amount: '1100',
      payment_date: '2023-09-12',
      payment_method: 'Card',
      status: 'Paid',
      img: 'assets/images/user/user6.jpg',
    },
  ];

  dataChange: BehaviorSubject<TransportFee[]> = new BehaviorSubject<
    TransportFee[]
  >([]);

  get data(): TransportFee[] {
    return this.dataChange.value;
  }

  getFees(): Observable<TransportFee[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addFee(fee: TransportFee): Observable<TransportFee> {
    this.staticData.push(fee);
    this.dataChange.next(this.staticData);
    return of(fee);
  }

  updateFee(fee: TransportFee): Observable<TransportFee> {
    const index = this.staticData.findIndex((it) => it.id === fee.id);
    if (index !== -1) {
      this.staticData[index] = fee;
      this.dataChange.next(this.staticData);
    }
    return of(fee);
  }

  deleteFee(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
