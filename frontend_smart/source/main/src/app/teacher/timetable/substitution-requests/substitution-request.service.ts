import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SubstitutionRequest } from './substitution-request.model';

@Injectable({
  providedIn: 'root',
})
export class SubstitutionRequestService {
  private httpClient = inject(HttpClient);

  private readonly mockData: SubstitutionRequest[] = [
    { id: 1, date: '2025-12-26', timeSlot: '10:00 AM - 11:00 AM', class: '10A', subject: 'Mathematics', reason: 'Medical Checkup', status: 'Pending' },
    { id: 2, date: '2025-12-27', timeSlot: '09:00 AM - 10:00 AM', class: '11B', subject: 'Physics', reason: 'Personal work', status: 'Approved' },
    { id: 3, date: '2025-12-28', timeSlot: '11:15 AM - 12:15 PM', class: '12C', subject: 'Chemistry', reason: 'Attending Workshop', status: 'Rejected' },
    { id: 4, date: '2025-12-29', timeSlot: '08:00 AM - 09:00 AM', class: '10B', subject: 'Biology', reason: 'Family event', status: 'Pending' },
    { id: 5, date: '2025-12-30', timeSlot: '01:30 PM - 02:30 PM', class: '9A', subject: 'English', reason: 'Internal meeting', status: 'Approved' },
    { id: 6, date: '2025-12-31', timeSlot: '10:00 AM - 11:00 AM', class: '11A', subject: 'History', reason: 'Bank work', status: 'Pending' },
    { id: 7, date: '2026-01-01', timeSlot: '02:30 PM - 03:30 PM', class: '12B', subject: 'Geography', reason: 'Unwell', status: 'Pending' },
    { id: 8, date: '2026-01-02', timeSlot: '09:00 AM - 10:00 AM', class: '9B', subject: 'PE', reason: 'Training', status: 'Approved' },
    { id: 9, date: '2026-01-03', timeSlot: '11:15 AM - 12:15 PM', class: '10A', subject: 'Mathematics', reason: 'Meeting', status: 'Pending' },
    { id: 10, date: '2026-01-04', timeSlot: '08:00 AM - 09:00 AM', class: '11B', subject: 'Physics', reason: 'Personal', status: 'Pending' },
    { id: 11, date: '2026-01-05', timeSlot: '10:00 AM - 11:00 AM', class: '12C', subject: 'Chemistry', reason: 'Conference', status: 'Approved' },
    { id: 12, date: '2026-01-06', timeSlot: '01:30 PM - 02:30 PM', class: '10B', subject: 'Biology', reason: 'Doctor appointment', status: 'Pending' },
  ];

  getAllRequests(): Observable<SubstitutionRequest[]> {
    return of(this.mockData);
  }

  addRequest(request: SubstitutionRequest): Observable<SubstitutionRequest> {
    this.mockData.unshift(request);
    return of(request);
  }

  updateRequest(request: SubstitutionRequest): Observable<SubstitutionRequest> {
    const index = this.mockData.findIndex((it) => it.id === request.id);
    if (index !== -1) {
      this.mockData[index] = request;
    }
    return of(request);
  }

  deleteRequest(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}


