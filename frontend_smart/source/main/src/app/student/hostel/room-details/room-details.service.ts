import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { RoomDetail } from './room-details.model';

@Injectable({
  providedIn: 'root',
})
export class RoomDetailsService {
  private data: RoomDetail[] = [
    { id: 1, roomNo: 'H1-101', roomType: 'AC', hostelName: 'Boys Hostel A', noOfBeds: 2, availability: 'Available', rent: 5000 },
    { id: 2, roomNo: 'H1-102', roomType: 'Non-AC', hostelName: 'Boys Hostel A', noOfBeds: 3, availability: 'Full', rent: 3500 },
    { id: 3, roomNo: 'H2-201', roomType: 'AC', hostelName: 'Girls Hostel B', noOfBeds: 2, availability: 'Available', rent: 5500 },
    { id: 4, roomNo: 'H2-202', roomType: 'Non-AC', hostelName: 'Girls Hostel B', noOfBeds: 4, availability: 'Available', rent: 3000 },
    { id: 5, roomNo: 'H1-103', roomType: 'AC Deluxe', hostelName: 'Boys Hostel A', noOfBeds: 1, availability: 'Full', rent: 8000 },
    { id: 6, roomNo: 'H1-104', roomType: 'Non-AC', hostelName: 'Boys Hostel A', noOfBeds: 2, availability: 'Available', rent: 3500 },
    { id: 7, roomNo: 'H2-203', roomType: 'AC Deluxe', hostelName: 'Girls Hostel B', noOfBeds: 1, availability: 'Available', rent: 8500 },
    { id: 8, roomNo: 'H2-204', roomType: 'Non-AC', hostelName: 'Girls Hostel B', noOfBeds: 3, availability: 'Full', rent: 3200 },
    { id: 9, roomNo: 'H3-301', roomType: 'AC', hostelName: 'Boys Hostel C', noOfBeds: 2, availability: 'Available', rent: 4800 },
    { id: 10, roomNo: 'H3-302', roomType: 'Non-AC', hostelName: 'Boys Hostel C', noOfBeds: 4, availability: 'Available', rent: 2800 },
    { id: 11, roomNo: 'H4-401', roomType: 'AC', hostelName: 'Girls Hostel D', noOfBeds: 2, availability: 'Full', rent: 5200 },
    { id: 12, roomNo: 'H4-402', roomType: 'Non-AC', hostelName: 'Girls Hostel D', noOfBeds: 3, availability: 'Available', rent: 3400 },
  ];

  getAllRooms(): Observable<RoomDetail[]> {
    return of(this.data);
  }

  addRoom(room: RoomDetail): Observable<RoomDetail> {
    room.id = Math.max(...this.data.map((r) => r.id)) + 1;
    this.data.unshift(room);
    return of(room);
  }

  updateRoom(room: RoomDetail): Observable<RoomDetail> {
    const index = this.data.findIndex((r) => r.id === room.id);
    if (index !== -1) {
      this.data[index] = room;
    }
    return of(room);
  }

  deleteRoom(id: number): Observable<boolean> {
    this.data = this.data.filter((r) => r.id !== id);
    return of(true);
  }
}
