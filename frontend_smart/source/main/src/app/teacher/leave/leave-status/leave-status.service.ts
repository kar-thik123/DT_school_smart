import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { LeaveStatus } from './leave-status.model';

@Injectable({
  providedIn: 'root',
})
export class LeaveStatusService {
  private httpClient = inject(HttpClient);

  private readonly mockData: LeaveStatus[] = [
    { id: 1, leaveType: 'Medical Leave', startDate: '2025-12-01', endDate: '2025-12-05', days: 5, applyDate: '2025-11-25', status: 'Approved', reason: 'Surgery' },
    { id: 2, leaveType: 'Casual Leave', startDate: '2025-11-10', endDate: '2025-11-10', days: 1, applyDate: '2025-11-08', status: 'Approved', reason: 'Personal' },
    { id: 3, leaveType: 'Sick Leave', startDate: '2025-10-15', endDate: '2025-10-16', days: 2, applyDate: '2025-10-14', status: 'Approved', reason: 'Fever' },
    { id: 4, leaveType: 'Medical Leave', startDate: '2025-09-01', endDate: '2025-09-03', days: 3, applyDate: '2025-08-28', status: 'Rejected', reason: 'Urgent Work' },
    { id: 5, leaveType: 'Casual Leave', startDate: '2025-08-20', endDate: '2025-08-20', days: 1, applyDate: '2025-08-18', status: 'Approved', reason: 'Bank work' },
    { id: 6, leaveType: 'Sick Leave', startDate: '2025-07-12', endDate: '2025-07-13', days: 2, applyDate: '2025-07-11', status: 'Approved', reason: 'Cold' },
    { id: 7, leaveType: 'Medical Leave', startDate: '2025-06-05', endDate: '2025-06-10', days: 6, applyDate: '2025-05-30', status: 'Approved', reason: 'Checkup' },
    { id: 8, leaveType: 'Casual Leave', startDate: '2025-05-22', endDate: '2025-05-22', days: 1, applyDate: '2025-05-20', status: 'Approved', reason: 'Event' },
    { id: 9, leaveType: 'Sick Leave', startDate: '2025-04-10', endDate: '2025-04-12', days: 3, applyDate: '2025-04-09', status: 'Approved', reason: 'Flu' },
    { id: 10, leaveType: 'Medical Leave', startDate: '2025-03-01', endDate: '2025-03-02', days: 2, applyDate: '2025-02-25', status: 'Rejected', reason: 'Staff shortage' },
    { id: 11, leaveType: 'Casual Leave', startDate: '2025-02-15', endDate: '2025-02-15', days: 1, applyDate: '2025-02-13', status: 'Approved', reason: 'Personal' },
    { id: 12, leaveType: 'Sick Leave', startDate: '2025-01-20', endDate: '2025-01-21', days: 2, applyDate: '2025-01-19', status: 'Approved', reason: 'Headache' },
  ];

  getLeaveStatus(): Observable<LeaveStatus[]> {
    return of(this.mockData);
  }

  addLeaveStatus(leave: LeaveStatus): Observable<LeaveStatus> {
    this.mockData.unshift(leave);
    return of(leave);
  }

  updateLeaveStatus(leave: LeaveStatus): Observable<LeaveStatus> {
    const index = this.mockData.findIndex((it) => it.id === leave.id);
    if (index !== -1) {
      this.mockData[index] = leave;
    }
    return of(leave);
  }

  deleteLeaveStatus(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}


