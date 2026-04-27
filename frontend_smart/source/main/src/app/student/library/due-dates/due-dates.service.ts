import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DueDate } from './due-dates.model';

@Injectable({
  providedIn: 'root',
})
export class DueDatesService {
  private data: DueDate[] = [
    { id: 1, bookTitle: 'Clean Code', isbnNo: '9780132350884', dueDate: '2025-02-15', daysRemaining: 5, fineAmount: 0, status: 'Active' },
    { id: 2, bookTitle: 'The Pragmatic Programmer', isbnNo: '9780135957059', dueDate: '2025-02-25', daysRemaining: 15, fineAmount: 0, status: 'Active' },
    { id: 3, bookTitle: 'Database System Concepts', isbnNo: '9780073523323', dueDate: '2025-03-01', daysRemaining: 19, fineAmount: 0, status: 'Active' },
    { id: 4, bookTitle: 'Operating System Concepts', isbnNo: '9781118063330', dueDate: '2025-03-15', daysRemaining: 33, fineAmount: 0, status: 'Active' },
    { id: 5, bookTitle: 'Modern Operating Systems', isbnNo: '9780133591620', dueDate: '2025-03-06', daysRemaining: 24, fineAmount: 0, status: 'Active' },
    { id: 6, bookTitle: 'Compilers: Principles, Techniques, and Tools', isbnNo: '9780321486813', dueDate: '2025-03-20', daysRemaining: 38, fineAmount: 0, status: 'Active' },
    { id: 7, bookTitle: 'Computer Architecture', isbnNo: '9780123838728', dueDate: '2025-03-11', daysRemaining: 29, fineAmount: 0, status: 'Active' },
    { id: 8, bookTitle: 'Design Patterns', isbnNo: '9780201633610', dueDate: '2025-01-20', daysRemaining: -21, fineAmount: 105, status: 'Overdue' },
    { id: 9, bookTitle: 'JavaScript: The Good Parts', isbnNo: '9780596517748', dueDate: '2025-01-25', daysRemaining: -16, fineAmount: 80, status: 'Overdue' },
    { id: 10, bookTitle: 'Eloquent JavaScript', isbnNo: '9781593275846', dueDate: '2025-01-30', daysRemaining: -11, fineAmount: 55, status: 'Overdue' },
    { id: 11, bookTitle: 'Structure and Interpretation of Computer Programs', isbnNo: '9780262510875', dueDate: '2025-02-05', daysRemaining: -5, fineAmount: 25, status: 'Overdue' },
    { id: 12, bookTitle: 'Code Complete', isbnNo: '9780735619678', dueDate: '2025-02-10', daysRemaining: 0, fineAmount: 0, status: 'Due Today' },
  ];

  getAllDueDates(): Observable<DueDate[]> {
    return of(this.data);
  }

  addDueDate(dueDate: DueDate): Observable<DueDate> {
    dueDate.id = Math.max(...this.data.map((d) => d.id)) + 1;
    this.data.unshift(dueDate);
    return of(dueDate);
  }

  updateDueDate(dueDate: DueDate): Observable<DueDate> {
    const index = this.data.findIndex((d) => d.id === dueDate.id);
    if (index !== -1) {
      this.data[index] = dueDate;
    }
    return of(dueDate);
  }

  deleteDueDate(id: number): Observable<boolean> {
    this.data = this.data.filter((d) => d.id !== id);
    return of(true);
  }
}
