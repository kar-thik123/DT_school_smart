import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MyRoute } from './my-route.model';

@Injectable({
  providedIn: 'root',
})
export class MyRouteService {
  private data: MyRoute[] = [
    { id: 1, routeName: 'Route A - North', stopName: 'Maple Street', pickupTime: '07:30 AM', dropTime: '04:00 PM', distance: '5 km', monthlyFees: 1500 },
    { id: 2, routeName: 'Route A - North', stopName: 'Oak Avenue', pickupTime: '07:45 AM', dropTime: '04:15 PM', distance: '7 km', monthlyFees: 1500 },
    { id: 3, routeName: 'Route B - South', stopName: 'Pine Road', pickupTime: '07:15 AM', dropTime: '04:30 PM', distance: '10 km', monthlyFees: 2000 },
    { id: 4, routeName: 'Route B - South', stopName: 'Cedar Lane', pickupTime: '07:30 AM', dropTime: '04:45 PM', distance: '12 km', monthlyFees: 2000 },
    { id: 5, routeName: 'Route C - East', stopName: 'Birch Blvd', pickupTime: '08:00 AM', dropTime: '03:30 PM', distance: '3 km', monthlyFees: 1200 },
    { id: 6, routeName: 'Route C - East', stopName: 'Willow Way', pickupTime: '08:15 AM', dropTime: '03:45 PM', distance: '4 km', monthlyFees: 1200 },
    { id: 7, routeName: 'Route D - West', stopName: 'Elm Street', pickupTime: '07:00 AM', dropTime: '04:45 PM', distance: '15 km', monthlyFees: 2500 },
    { id: 8, routeName: 'Route D - West', stopName: 'Ash Drive', pickupTime: '07:15 AM', dropTime: '05:00 PM', distance: '18 km', monthlyFees: 2500 },
    { id: 9, routeName: 'Route E - Central', stopName: 'Main Square', pickupTime: '08:30 AM', dropTime: '03:00 PM', distance: '1 km', monthlyFees: 800 },
    { id: 10, routeName: 'Route E - Central', stopName: 'Park View', pickupTime: '08:45 AM', dropTime: '03:15 PM', distance: '2 km', monthlyFees: 800 },
    { id: 11, routeName: 'Route F - Suburbs', stopName: 'River Side', pickupTime: '06:45 AM', dropTime: '05:15 PM', distance: '22 km', monthlyFees: 3000 },
    { id: 12, routeName: 'Route F - Suburbs', stopName: 'Hill Top', pickupTime: '07:00 AM', dropTime: '05:30 PM', distance: '25 km', monthlyFees: 3000 },
  ];

  getAllRoutes(): Observable<MyRoute[]> {
    return of(this.data);
  }

  addRoute(route: MyRoute): Observable<MyRoute> {
    route.id = Math.max(...this.data.map((r) => r.id)) + 1;
    this.data.unshift(route);
    return of(route);
  }

  updateRoute(route: MyRoute): Observable<MyRoute> {
    const index = this.data.findIndex((r) => r.id === route.id);
    if (index !== -1) {
      this.data[index] = route;
    }
    return of(route);
  }

  deleteRoute(id: number): Observable<boolean> {
    this.data = this.data.filter((r) => r.id !== id);
    return of(true);
  }
}
