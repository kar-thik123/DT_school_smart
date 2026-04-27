import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Assignment } from './assignments.model';

@Injectable({
  providedIn: 'root',
})
export class AssignmentsService {
  private readonly data: Assignment[] = [
    { id: 1, title: 'Calculus Assignment 1', subject: 'Mathematics', assignedDate: '2025-12-01', dueDate: '2025-12-10', status: 'Submitted', downloadUrl: '#' },
    { id: 2, title: 'Quantum Mechanics Paper', subject: 'Physics', assignedDate: '2025-12-05', dueDate: '2025-12-15', status: 'Pending', downloadUrl: '#' },
    { id: 3, title: 'Organic Chemistry Lab Report', subject: 'Chemistry', assignedDate: '2025-12-08', dueDate: '2025-12-12', status: 'Late', downloadUrl: '#' },
    { id: 4, title: 'Data Structures Project', subject: 'Computer Science', assignedDate: '2025-12-10', dueDate: '2025-12-20', status: 'Submitted', downloadUrl: '#' },
    { id: 5, title: 'Shakespeare Analysis', subject: 'English Literature', assignedDate: '2025-12-12', dueDate: '2025-12-18', status: 'Pending', downloadUrl: '#' },
    { id: 6, title: 'French Revolution Essay', subject: 'History', assignedDate: '2025-12-15', dueDate: '2025-12-22', status: 'Submitted', downloadUrl: '#' },
    { id: 7, title: 'Genetics Problem Set', subject: 'Biology', assignedDate: '2025-12-18', dueDate: '2025-12-25', status: 'Pending', downloadUrl: '#' },
    { id: 8, title: 'Climate Change Report', subject: 'Geography', assignedDate: '2025-12-20', dueDate: '2025-12-30', status: 'Pending', downloadUrl: '#' },
    { id: 9, title: 'Abstract Painting Project', subject: 'Art & Design', assignedDate: '2025-12-22', dueDate: '2026-01-05', status: 'Pending', downloadUrl: '#' },
    { id: 10, title: 'Fitness Plan', subject: 'Physical Education', assignedDate: '2025-12-24', dueDate: '2026-01-02', status: 'Submitted', downloadUrl: '#' },
    { id: 11, title: 'Macroeconomics Quiz', subject: 'Economics', assignedDate: '2025-12-26', dueDate: '2025-12-28', status: 'Pending', downloadUrl: '#' },
    { id: 12, title: 'UN Debate Preparation', subject: 'Political Science', assignedDate: '2025-12-28', dueDate: '2026-01-08', status: 'Pending', downloadUrl: '#' },
  ];

  dataChange: BehaviorSubject<Assignment[]> = new BehaviorSubject<Assignment[]>([]);

  constructor() {}

  get dataItems(): Assignment[] {
    return this.dataChange.value;
  }

  getAllAssignments(): Observable<Assignment[]> {
    return of(this.data);
  }

  addAssignment(assignment: Assignment): void {
    this.data.unshift(assignment);
  }

  updateAssignment(assignment: Assignment): void {
    const index = this.data.findIndex((it) => it.id === assignment.id);
    if (index !== -1) {
      this.data[index] = assignment;
    }
  }

  deleteAssignment(id: number): Observable<boolean> {
    const index = this.data.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
