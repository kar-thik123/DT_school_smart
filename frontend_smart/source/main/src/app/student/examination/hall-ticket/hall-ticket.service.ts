import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HallTicket } from './hall-ticket.model';

@Injectable({
  providedIn: 'root',
})
export class HallTicketService {
  private readonly data: HallTicket[] = [
    { id: 1, examName: 'Final Examination 2026', subject: 'Mathematics', examDate: '2026-03-10', startTime: '09:00 AM', roomNo: '101', rollNo: 'S1001', downloadUrl: '#' },
    { id: 2, examName: 'Final Examination 2026', subject: 'Physics', examDate: '2026-03-12', startTime: '09:00 AM', roomNo: '102', rollNo: 'S1001', downloadUrl: '#' },
    { id: 3, examName: 'Final Examination 2026', subject: 'Chemistry', examDate: '2026-03-14', startTime: '09:00 AM', roomNo: '103', rollNo: 'S1001', downloadUrl: '#' },
    { id: 4, examName: 'Final Examination 2026', subject: 'Biology', examDate: '2026-03-16', startTime: '09:00 AM', roomNo: '104', rollNo: 'S1001', downloadUrl: '#' },
    { id: 5, examName: 'Final Examination 2026', subject: 'English', examDate: '2026-03-18', startTime: '09:00 AM', roomNo: '105', rollNo: 'S1001', downloadUrl: '#' },
    { id: 6, examName: 'Final Examination 2026', subject: 'History', examDate: '2026-03-20', startTime: '09:00 AM', roomNo: '106', rollNo: 'S1001', downloadUrl: '#' },
    { id: 7, examName: 'Final Examination 2026', subject: 'Geography', examDate: '2026-03-22', startTime: '09:00 AM', roomNo: '107', rollNo: 'S1001', downloadUrl: '#' },
    { id: 8, examName: 'Final Examination 2026', subject: 'Computer Science', examDate: '2026-03-24', startTime: '09:00 AM', roomNo: '108', rollNo: 'S1001', downloadUrl: '#' },
    { id: 9, examName: 'Final Examination 2026', subject: 'Economics', examDate: '2026-03-26', startTime: '09:00 AM', roomNo: '109', rollNo: 'S1001', downloadUrl: '#' },
    { id: 10, examName: 'Final Examination 2026', subject: 'Political Science', examDate: '2026-03-28', startTime: '09:00 AM', roomNo: '110', rollNo: 'S1001', downloadUrl: '#' },
    { id: 11, examName: 'Final Examination 2026', subject: 'Art', examDate: '2026-03-30', startTime: '09:00 AM', roomNo: '111', rollNo: 'S1001', downloadUrl: '#' },
    { id: 12, examName: 'Final Examination 2026', subject: 'Music', examDate: '2026-04-01', startTime: '09:00 AM', roomNo: '112', rollNo: 'S1001', downloadUrl: '#' },
  ];

  dataChange: BehaviorSubject<HallTicket[]> = new BehaviorSubject<HallTicket[]>([]);

  constructor() {}

  get dataItems(): HallTicket[] {
    return this.dataChange.value;
  }

  getAllTickets(): Observable<HallTicket[]> {
    return of(this.data);
  }

  addTicket(ticket: HallTicket): void {
    this.data.unshift(ticket);
  }

  updateTicket(ticket: HallTicket): void {
    const index = this.data.findIndex((it) => it.id === ticket.id);
    if (index !== -1) {
      this.data[index] = ticket;
    }
  }

  deleteTicket(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
