import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Assignment } from './assignment.model';

@Injectable({
  providedIn: 'root',
})
export class AssignmentService {
  private httpClient = inject(HttpClient);

  private readonly mockData: Assignment[] = [
    { id: 1, class: '10A', subject: 'Mathematics', title: 'Algebra Homework', assignedDate: '2025-12-25', dueDate: '2025-12-28', status: 'Active', submissions: 25 },
    { id: 2, class: '11B', subject: 'Physics', title: 'Newtonian Motion Project', assignedDate: '2025-12-24', dueDate: '2025-12-30', status: 'Active', submissions: 15 },
    { id: 3, class: '12C', subject: 'Chemistry', title: 'Organic Synthesis Lab Report', assignedDate: '2025-12-20', dueDate: '2025-12-26', status: 'Active', submissions: 28 },
    { id: 4, class: '10B', subject: 'Biology', title: 'Cell Structure Diagram', assignedDate: '2025-12-22', dueDate: '2025-12-25', status: 'Closed', submissions: 40 },
    { id: 5, class: '9A', subject: 'English', title: 'Essay on Romeo and Juliet', assignedDate: '2025-12-23', dueDate: '2025-12-29', status: 'Active', submissions: 32 },
    { id: 6, class: '11A', subject: 'History', title: 'World War II Summary', assignedDate: '2025-12-19', dueDate: '2025-12-24', status: 'Closed', submissions: 36 },
    { id: 7, class: '12B', subject: 'Geography', title: 'Map Marking - Rivers', assignedDate: '2025-12-21', dueDate: '2025-12-27', status: 'Active', submissions: 10 },
    { id: 8, class: '9B', subject: 'PE', title: 'Sportsmanship Essay', assignedDate: '2025-12-22', dueDate: '2025-12-28', status: 'Active', submissions: 20 },
    { id: 9, class: '10A', subject: 'Mathematics', title: 'Trigonometry Worksheet', assignedDate: '2025-12-20', dueDate: '2025-12-23', status: 'Closed', submissions: 39 },
    { id: 10, class: '11B', subject: 'Physics', title: 'Circuit Design Assignment', assignedDate: '2025-12-18', dueDate: '2025-12-22', status: 'Closed', submissions: 34 },
    { id: 11, class: '12C', subject: 'Chemistry', title: 'Periodic Table Quiz', assignedDate: '2025-12-15', dueDate: '2025-12-19', status: 'Closed', submissions: 30 },
    { id: 12, class: '10B', subject: 'Biology', title: 'Genetics Problems', assignedDate: '2025-12-10', dueDate: '2025-12-15', status: 'Closed', submissions: 41 },
  ];

  getAllAssignments(): Observable<Assignment[]> {
    return of(this.mockData);
  }

  addAssignment(assignment: Assignment): Observable<Assignment> {
    this.mockData.unshift(assignment);
    return of(assignment);
  }

  updateAssignment(assignment: Assignment): Observable<Assignment> {
    const index = this.mockData.findIndex((it) => it.id === assignment.id);
    if (index !== -1) {
      this.mockData[index] = assignment;
    }
    return of(assignment);
  }

  deleteAssignment(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }

}

