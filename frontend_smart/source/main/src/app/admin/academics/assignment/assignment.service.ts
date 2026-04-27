import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Assignment } from './assignment.model';

@Injectable({
  providedIn: 'root',
})
export class AssignmentService {
  private assignments: Assignment[] = [
    {
      id: 1,
      className: 'Class 1',
      subjectName: 'Mathematics',
      teacherName: 'John Doe',
      assignmentDate: '2023-10-01',
      status: 'Published',
      title: 'Algebra Basics',
      deadline: '2023-10-10',
      details: 'Solve exercises 1 to 10.',
    },
    {
      id: 2,
      className: 'Class 2',
      subjectName: 'Science',
      teacherName: 'Jane Smith',
      assignmentDate: '2023-10-02',
      status: 'Draft',
      title: 'Photosynthesis',
      deadline: '2023-10-12',
      details: 'Draw a diagram of photosynthesis.',
    },
    {
      id: 3,
      className: 'Class 3',
      subjectName: 'English',
      teacherName: 'Alice Brown',
      assignmentDate: '2023-10-03',
      status: 'Published',
      title: 'Essay Writing',
      deadline: '2023-10-15',
      details: 'Write an essay on environment.',
    },
    {
      id: 4,
      className: 'Class 4',
      subjectName: 'History',
      teacherName: 'Bob White',
      assignmentDate: '2023-10-04',
      status: 'Published',
      title: 'Ancient Civilizations',
      deadline: '2023-10-20',
      details: 'Research about Indus Valley.',
    },
    {
      id: 5,
      className: 'Class 5',
      subjectName: 'Geography',
      teacherName: 'Charlie Green',
      assignmentDate: '2023-10-05',
      status: 'Draft',
      title: 'Map Reading',
      deadline: '2023-10-22',
      details: 'Identify major rivers in India.',
    },
    {
      id: 6,
      className: 'Class 6',
      subjectName: 'Physics',
      teacherName: 'David Black',
      assignmentDate: '2023-10-06',
      status: 'Published',
      title: 'Newton Laws',
      deadline: '2023-10-25',
      details: 'Explain the three laws of motion.',
    },
    {
      id: 7,
      className: 'Class 7',
      subjectName: 'Chemistry',
      teacherName: 'Emma Watson',
      assignmentDate: '2023-10-07',
      status: 'Published',
      title: 'Periodic Table',
      deadline: '2023-10-28',
      details: 'Memorize first 20 elements.',
    },
    {
      id: 8,
      className: 'Class 8',
      subjectName: 'Biology',
      teacherName: 'Frank Miller',
      assignmentDate: '2023-10-08',
      status: 'Draft',
      title: 'Cell Structure',
      deadline: '2023-10-30',
      details: 'Describe plant and animal cells.',
    },
    {
      id: 9,
      className: 'Class 9',
      subjectName: 'Computer Science',
      teacherName: 'Grace Hopper',
      assignmentDate: '2023-10-09',
      status: 'Published',
      title: 'Python Basics',
      deadline: '2023-11-05',
      details: 'Write a program for Fibonacci series.',
    },
    {
      id: 10,
      className: 'Class 10',
      subjectName: 'Economics',
      teacherName: 'Henry Ford',
      assignmentDate: '2023-10-10',
      status: 'Published',
      title: 'Supply and Demand',
      deadline: '2023-11-10',
      details: 'Explain the law of demand.',
    },
    {
      id: 11,
      className: 'Class 11',
      subjectName: 'Psychology',
      teacherName: 'Isabel Bloom',
      assignmentDate: '2023-10-11',
      status: 'Draft',
      title: 'Behavioral Science',
      deadline: '2023-11-12',
      details: 'Conduct a small survey.',
    },
    {
      id: 12,
      className: 'Class 12',
      subjectName: 'Political Science',
      teacherName: 'Jack Reacher',
      assignmentDate: '2023-10-12',
      status: 'Published',
      title: 'Democracy',
      deadline: '2023-11-15',
      details: 'Discuss merits of democracy.',
    },
  ];

  dataChange: BehaviorSubject<Assignment[]> = new BehaviorSubject<Assignment[]>(
    []
  );

  getAllAssignments(): Observable<Assignment[]> {
    this.dataChange.next(this.assignments);
    return of(this.assignments);
  }

  addAssignment(assignment: Assignment): Observable<Assignment> {
    assignment.id = Math.max(...this.assignments.map((a) => a.id), 0) + 1;
    this.assignments.push(assignment);
    this.dataChange.next(this.assignments);
    return of(assignment);
  }

  updateAssignment(assignment: Assignment): Observable<Assignment> {
    const index = this.assignments.findIndex((a) => a.id === assignment.id);
    if (index !== -1) {
      this.assignments[index] = assignment;
      this.dataChange.next(this.assignments);
    }
    return of(assignment);
  }

  deleteAssignment(id: number): Observable<number> {
    this.assignments = this.assignments.filter((a) => a.id !== id);
    this.dataChange.next(this.assignments);
    return of(id);
  }
}
