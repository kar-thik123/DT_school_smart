import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { HostelRoomType } from './hostel-room-type.model';

@Injectable({
  providedIn: 'root',
})
export class HostelRoomTypeService {
  private httpClient = inject(HttpClient);

  private readonly API_URL = 'assets/data/hostel-room-type.json';
  dataChange: BehaviorSubject<HostelRoomType[]> = new BehaviorSubject<
    HostelRoomType[]
  >([]);

  /** GET: Fetch all hostel room types */
  getHostelRoomTypes(): Observable<HostelRoomType[]> {
    return this.httpClient.get<HostelRoomType[]>(this.API_URL).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /** POST: Add a new hostel room type */
  addHostelRoomType(
    hostelRoomType: HostelRoomType
  ): Observable<HostelRoomType> {
    // Simulate adding the hostel room type to the local data array
    return of(hostelRoomType).pipe(
      map((_response) => {
        return hostelRoomType;
      }),
      catchError(this.handleError)
    );

    // API call to add the hostel room type
    // return this.httpClient.post<HostelRoomType>(this.API_URL, hostelRoomType).pipe(
    //   map((response) => {
    //     return response;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** PUT: Update an existing hostel room type */
  updateHostelRoomType(
    hostelRoomType: HostelRoomType
  ): Observable<HostelRoomType> {
    // Simulate updating the hostel room type in the local data array
    return of(hostelRoomType).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.handleError)
    );

    // API call to update the hostel room type
    // return this.httpClient.put<HostelRoomType>(`${this.API_URL}`, hostelRoomType).pipe(
    //   map((response) => {
    //     return response;
    //   }),
    //   catchError(this.handleError)
    // );
  }

  /** DELETE: Remove a hostel room type by ID */
  deleteHostelRoomType(id: number): Observable<number> {
    // Simulate deleting the hostel room type from the local data array
    return of(id).pipe(
      map((_response) => {
        return id;
      }),
      catchError(this.handleError)
    );

    // API call to delete the hostel room type
    // return this.httpClient.delete<void>(`${this.API_URL}`).pipe(
    //   map((response) => {
    //     return id;
    //   }),
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
