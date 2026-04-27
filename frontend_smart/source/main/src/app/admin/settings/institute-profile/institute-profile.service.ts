import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { InstituteProfile, IInstituteProfile } from './institute-profile.model';

@Injectable({
  providedIn: 'root',
})
export class InstituteProfileService {
  private httpClient = inject(HttpClient);

  dataChange: BehaviorSubject<InstituteProfile[]> = new BehaviorSubject<
    InstituteProfile[]
  >([]);

  private staticData: IInstituteProfile[] = [
    {
      id: 1,
      img: 'assets/images/user/user1.jpg',
      instituteName: 'Smart Academy',
      code: 'SA001',
      type: 'Private',
      location: 'New York',
      contactPerson: 'John Doe',
      phone: '1234567890',
      email: 'info@smartacademy.com',
      status: 'Active',
    },
    {
      id: 2,
      img: 'assets/images/user/user2.jpg',
      instituteName: 'Green Valley School',
      code: 'GV002',
      type: 'Public',
      location: 'London',
      contactPerson: 'Sarah Smith',
      phone: '2345678901',
      email: 'contact@greenvalley.com',
      status: 'Active',
    },
    {
      id: 3,
      img: 'assets/images/user/user3.jpg',
      instituteName: 'Elite Technical Institute',
      code: 'ET003',
      type: 'Government',
      location: 'Berlin',
      contactPerson: 'Mike Johnson',
      phone: '3456789012',
      email: 'admin@elitetech.com',
      status: 'Inactive',
    },
    {
      id: 4,
      img: 'assets/images/user/user4.jpg',
      instituteName: 'Ocean View High',
      code: 'OV004',
      type: 'Private',
      location: 'Sydney',
      contactPerson: 'Emily Davis',
      phone: '4567890123',
      email: 'hello@oceanview.com',
      status: 'Active',
    },
    {
      id: 5,
      img: 'assets/images/user/user5.jpg',
      instituteName: 'Mountain Top College',
      code: 'MT005',
      type: 'Private',
      location: 'Denver',
      contactPerson: 'David Wilson',
      phone: '5678901234',
      email: 'info@mountaintop.com',
      status: 'Active',
    },
    {
      id: 6,
      img: 'assets/images/user/user6.jpg',
      instituteName: 'Central City School',
      code: 'CC006',
      type: 'Public',
      location: 'Chicago',
      contactPerson: 'Lisa Brown',
      phone: '6789012345',
      email: 'admin@centralcity.edu',
      status: 'Active',
    },
    {
      id: 7,
      img: 'assets/images/user/user7.jpg',
      instituteName: 'East Side Academy',
      code: 'ES007',
      type: 'Private',
      location: 'Tokyo',
      contactPerson: 'Robert Taylor',
      phone: '7890123456',
      email: 'contact@eastside.jp',
      status: 'Active',
    },
    {
      id: 8,
      img: 'assets/images/user/user8.jpg',
      instituteName: 'West End School',
      code: 'WE008',
      type: 'Public',
      location: 'Toronto',
      contactPerson: 'Jennifer White',
      phone: '8901234567',
      email: 'info@westend.ca',
      status: 'Active',
    },
    {
      id: 9,
      img: 'assets/images/user/user9.jpg',
      instituteName: 'North Star Institute',
      code: 'NS009',
      type: 'Private',
      location: 'Paris',
      contactPerson: 'William Clark',
      phone: '9012345678',
      email: 'admin@northstar.fr',
      status: 'Inactive',
    },
    {
      id: 10,
      img: 'assets/images/user/user10.jpg',
      instituteName: 'South Park High',
      code: 'SP010',
      type: 'Public',
      location: 'Moscow',
      contactPerson: 'Amanda Lee',
      phone: '0123456789',
      email: 'hello@southpark.ru',
      status: 'Active',
    },
    {
      id: 11,
      img: 'assets/images/user/user11.jpg',
      instituteName: 'Global International',
      code: 'GI011',
      type: 'Private',
      location: 'Dubai',
      contactPerson: 'Chris Martin',
      phone: '1122334455',
      email: 'info@global.ae',
      status: 'Active',
    },
    {
      id: 12,
      img: 'assets/images/user/user6.jpg',
      instituteName: 'St. Mary’s School',
      code: 'SM012',
      type: 'Religious',
      location: 'Rome',
      contactPerson: 'Jessica King',
      phone: '2233445566',
      email: 'admin@stmarys.it',
      status: 'Active',
    },
    {
      id: 13,
      img: 'assets/images/user/user1.jpg',
      instituteName: 'Lake Side Academy',
      code: 'LS013',
      type: 'Private',
      location: 'Geneva',
      contactPerson: 'Matthew Hall',
      phone: '3344556677',
      email: 'contact@lakeside.ch',
      status: 'Active',
    },
  ];

  getAllProfiles(): Observable<InstituteProfile[]> {
    return of(this.staticData as InstituteProfile[]).pipe(
      map((data) => {
        this.dataChange.next(data);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  addProfile(profile: InstituteProfile): Observable<InstituteProfile> {
    return of(profile).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  updateProfile(profile: InstituteProfile): Observable<InstituteProfile> {
    return of(profile).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  deleteProfile(id: number): Observable<number> {
    return of(id).pipe(
      map((_response) => id),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
