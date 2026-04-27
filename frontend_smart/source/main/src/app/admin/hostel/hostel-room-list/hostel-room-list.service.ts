import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { HostelRoomList } from './hostel-room-list.model';

@Injectable({
  providedIn: 'root',
})
export class HostelRoomListService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/hostel-room-list.json';
  dataChange: BehaviorSubject<HostelRoomList[]> = new BehaviorSubject<
    HostelRoomList[]
  >([]);

  /** CRUD METHODS */

  /** GET: Fetch all hostel rooms */
  getHostelRooms(): Observable<HostelRoomList[]> {
    return this.httpClient.get<HostelRoomList[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new hostel room */
  addHostelRoom(hostelRoom: HostelRoomList): Observable<HostelRoomList> {
    // Simulating the addition of a hostel room
    return of(hostelRoom).pipe(
      map(() => hostelRoom), // Return the added hostel room
      catchError(this.handleError)
    );

    // Uncomment for real API call
    // return this.httpClient.post<HostelRoomList>(this.API_URL, hostelRoom).pipe(
    //   map(() => hostelRoom), // Return the added hostel room
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing hostel room */
  updateHostelRoom(hostelRoom: HostelRoomList): Observable<HostelRoomList> {
    // Simulating the update of a hostel room
    return of(hostelRoom).pipe(
      map(() => hostelRoom), // Return the updated hostel room
      catchError(this.handleError)
    );

    // Uncomment for real API call
    // return this.httpClient.put<HostelRoomList>(`${this.API_URL}`, hostelRoom).pipe(
    //   map(() => hostelRoom), // Return the updated hostel room
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a hostel room by ID */
  deleteHostelRoom(id: number): Observable<number> {
    // Simulating the deletion of a hostel room
    return of(id).pipe(
      map(() => id), // Return the ID of the deleted hostel room
      catchError(this.handleError)
    );

    // Uncomment for real API call
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map(() => id), // Return the ID of the deleted hostel room
    //   catchError(this.handleError)
    // );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
