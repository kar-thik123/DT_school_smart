import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TransportRoute } from './routes-page.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TransportRouteService {
  private httpClient = inject(HttpClient);
  private staticData: any[] = [
    {
      id: 1,
      route_name: 'North Campus - Main Gate',
      start_point: 'North Campus',
      end_point: 'Main Gate',
      distance: '5 km',
      vehicle_no: 'VH-2021-001',
      route_fees: '50',
      status: 'Active',
    },
    {
      id: 2,
      route_name: 'City Center - South Block',
      start_point: 'City Center',
      end_point: 'South Block',
      distance: '12 km',
      vehicle_no: 'VH-2020-002',
      route_fees: '120',
      status: 'Active',
    },
    {
      id: 3,
      route_name: 'Airport Road - Science Wing',
      start_point: 'Airport Road',
      end_point: 'Science Wing',
      distance: '15 km',
      vehicle_no: 'VH-2019-003',
      route_fees: '150',
      status: 'Inactive',
    },
    {
      id: 4,
      route_name: 'Green Valley - Arts College',
      start_point: 'Green Valley',
      end_point: 'Arts College',
      distance: '8 km',
      vehicle_no: 'VH-2022-004',
      route_fees: '80',
      status: 'Active',
    },
    {
      id: 5,
      route_name: 'Railway Station - Hostel Block',
      start_point: 'Railway Station',
      end_point: 'Hostel Block',
      distance: '10 km',
      vehicle_no: 'VH-2021-005',
      route_fees: '100',
      status: 'Active',
    },
    {
      id: 6,
      route_name: 'East Suburb - Library',
      start_point: 'East Suburb',
      end_point: 'Library',
      distance: '20 km',
      vehicle_no: 'VH-2018-006',
      route_fees: '200',
      status: 'Active',
    },
    {
      id: 7,
      route_name: 'West End - Sports Complex',
      start_point: 'West End',
      end_point: 'Sports Complex',
      distance: '18 km',
      vehicle_no: 'VH-2023-007',
      route_fees: '180',
      status: 'Active',
    },
    {
      id: 8,
      route_name: 'Hill Top - Medical Center',
      start_point: 'Hill Top',
      end_point: 'Medical Center',
      distance: '25 km',
      vehicle_no: 'VH-2020-008',
      route_fees: '250',
      status: 'Active',
    },
    {
      id: 9,
      route_name: 'Market Square - Admin Block',
      start_point: 'Market Square',
      end_point: 'Admin Block',
      distance: '6 km',
      vehicle_no: 'VH-2017-009',
      route_fees: '60',
      status: 'Active',
    },
    {
      id: 10,
      route_name: 'Lake Side - Engineering Wing',
      start_point: 'Lake Side',
      end_point: 'Engineering Wing',
      distance: '14 km',
      vehicle_no: 'VH-2021-010',
      route_fees: '140',
      status: 'Active',
    },
    {
      id: 11,
      route_name: 'Central Plaza - IT Center',
      start_point: 'Central Plaza',
      end_point: 'IT Center',
      distance: '7 km',
      vehicle_no: 'VH-2022-011',
      route_fees: '70',
      status: 'Active',
    },
    {
      id: 12,
      route_name: 'Old Town - PG Hostel',
      start_point: 'Old Town',
      end_point: 'PG Hostel',
      distance: '11 km',
      vehicle_no: 'VH-2019-012',
      route_fees: '110',
      status: 'Active',
    },
  ];

  dataChange: BehaviorSubject<TransportRoute[]> = new BehaviorSubject<TransportRoute[]>([]);

  get data(): TransportRoute[] {
    return this.dataChange.value;
  }

  getRoutes(): Observable<TransportRoute[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addRoute(route: TransportRoute): Observable<TransportRoute> {
    this.staticData.push(route);
    this.dataChange.next(this.staticData);
    return of(route);
  }

  updateRoute(route: TransportRoute): Observable<TransportRoute> {
    const index = this.staticData.findIndex((it) => it.id === route.id);
    if (index !== -1) {
      this.staticData[index] = route;
      this.dataChange.next(this.staticData);
    }
    return of(route);
  }

  deleteRoute(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
