import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SeatAllocation } from './seat-allocation.model';

@Injectable({
  providedIn: 'root',
})
export class SeatAllocationService {
  dataChange: BehaviorSubject<SeatAllocation[]> = new BehaviorSubject<SeatAllocation[]>([]);

  private staticData: any[] = [
    { id: 1, student_name: 'John Doe', application_no: 'APP001', course: 'Computer Science', category: 'General', allotted_seat_type: 'Merit', allocation_date: '2024-06-15', reporting_date: '2024-06-20', status: 'Confirmed', fees_paid: true, getRandomID: () => 1 },
    { id: 2, student_name: 'Jane Smith', application_no: 'APP002', course: 'Computer Science', category: 'OBC', allotted_seat_type: 'Merit', allocation_date: '2024-06-15', reporting_date: '2024-06-20', status: 'Pending', fees_paid: false, getRandomID: () => 2 },
    { id: 3, student_name: 'Mike Ross', application_no: 'APP003', course: 'Law', category: 'General', allotted_seat_type: 'Management', allocation_date: '2024-06-16', reporting_date: '2024-06-21', status: 'Confirmed', fees_paid: true, getRandomID: () => 3 },
    { id: 4, student_name: 'Rachel Zane', application_no: 'APP004', course: 'Law', category: 'SC', allotted_seat_type: 'Reserved', allocation_date: '2024-06-16', reporting_date: '2024-06-21', status: 'Cancelled', fees_paid: false, getRandomID: () => 4 },
    { id: 5, student_name: 'Harvey Specter', application_no: 'APP005', course: 'Economics', category: 'General', allotted_seat_type: 'Merit', allocation_date: '2024-06-17', reporting_date: '2024-06-22', status: 'Confirmed', fees_paid: true, getRandomID: () => 5 },
    { id: 6, student_name: 'Donna Paulsen', application_no: 'APP006', course: 'Management', category: 'General', allotted_seat_type: 'Merit', allocation_date: '2024-06-17', reporting_date: '2024-06-22', status: 'Confirmed', fees_paid: true, getRandomID: () => 6 },
    { id: 7, student_name: 'Louis Litt', application_no: 'APP007', course: 'Finance', category: 'General', allotted_seat_type: 'Merit', allocation_date: '2024-06-18', reporting_date: '2024-06-23', status: 'Pending', fees_paid: false, getRandomID: () => 7 },
    { id: 8, student_name: 'Jessica Pearson', application_no: 'APP008', course: 'Political Science', category: 'General', allotted_seat_type: 'Merit', allocation_date: '2024-06-18', reporting_date: '2024-06-23', status: 'Confirmed', fees_paid: true, getRandomID: () => 8 },
    { id: 9, student_name: 'Oliver Queen', application_no: 'APP009', course: 'Mechanical Eng', category: 'ST', allotted_seat_type: 'Reserved', allocation_date: '2024-06-19', reporting_date: '2024-06-24', status: 'Confirmed', fees_paid: true, getRandomID: () => 9 },
    { id: 10, student_name: 'Barry Allen', application_no: 'APP010', course: 'Physics', category: 'OBC', allotted_seat_type: 'Merit', allocation_date: '2024-06-19', reporting_date: '2024-06-24', status: 'Confirmed', fees_paid: true, getRandomID: () => 10 },
    { id: 11, student_name: 'Iris West', application_no: 'APP011', course: 'Journalism', category: 'General', allotted_seat_type: 'Merit', allocation_date: '2024-06-20', reporting_date: '2024-06-25', status: 'Confirmed', fees_paid: true, getRandomID: () => 11 },
    { id: 12, student_name: 'Cisco Ramon', application_no: 'APP012', course: 'Electrical Eng', category: 'SC', allotted_seat_type: 'Reserved', allocation_date: '2024-06-20', reporting_date: '2024-06-25', status: 'Pending', fees_paid: false, getRandomID: () => 12 },
  ];

  get data(): SeatAllocation[] {
    return this.dataChange.value;
  }

  getAllSeatAllocations(): Observable<SeatAllocation[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addSeatAllocation(seatAllocation: SeatAllocation): Observable<SeatAllocation> {
    this.staticData.push(seatAllocation);
    this.dataChange.next(this.staticData);
    return of(seatAllocation);
  }

  updateSeatAllocation(seatAllocation: SeatAllocation): Observable<SeatAllocation> {
    const index = this.staticData.findIndex((item) => item.id === seatAllocation.id);
    if (index !== -1) {
      this.staticData[index] = seatAllocation;
      this.dataChange.next(this.staticData);
    }
    return of(seatAllocation);
  }

  deleteSeatAllocation(id: number): Observable<number> {
    const index = this.staticData.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
