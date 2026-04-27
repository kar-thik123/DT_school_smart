import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BookHistory } from './book-history.model';

@Injectable({
  providedIn: 'root',
})
export class BookHistoryService {
  private data: BookHistory[] = [
    { id: 1, bookTitle: 'Introduction to Algorithms', author: 'Cormen et al.', isbnNo: '9780262033848', issueDate: '2024-01-10', returnDate: '2024-01-24', category: 'Computer Science' },
    { id: 2, bookTitle: 'Clean Code', author: 'Robert C. Martin', isbnNo: '9780132350884', issueDate: '2024-02-01', returnDate: '2024-02-15', category: 'Programming' },
    { id: 3, bookTitle: 'Design Patterns', author: 'Gamma et al.', isbnNo: '9780201633610', issueDate: '2024-01-05', returnDate: '2024-01-22', category: 'Software Design' },
    { id: 4, bookTitle: 'The Pragmatic Programmer', author: 'Hunt & Thomas', isbnNo: '9780135957059', issueDate: '2024-02-10', returnDate: '2024-02-25', category: 'Programming' },
    { id: 5, bookTitle: 'Artificial Intelligence', author: 'Russell & Norvig', isbnNo: '9780134610993', issueDate: '2024-01-15', returnDate: '2024-01-29', category: 'AI' },
    { id: 6, bookTitle: 'Database System Concepts', author: 'Silberschatz et al.', isbnNo: '9780073523323', issueDate: '2024-02-15', returnDate: '2024-03-01', category: 'Database' },
    { id: 7, bookTitle: 'Computer Networks', author: 'Tanenbaum', isbnNo: '9780132126953', issueDate: '2024-01-20', returnDate: '2024-02-03', category: 'Networking' },
    { id: 8, bookTitle: 'Operating System Concepts', author: 'Silberschatz', isbnNo: '9781118063330', issueDate: '2024-03-01', returnDate: '2024-03-15', category: 'Operating Systems' },
    { id: 9, bookTitle: 'Modern Operating Systems', author: 'Tanenbaum', isbnNo: '9780133591620', issueDate: '2024-02-20', returnDate: '2024-03-06', category: 'Operating Systems' },
    { id: 10, bookTitle: 'The C Programming Language', author: 'Kernighan & Ritchie', isbnNo: '9780131103627', issueDate: '2024-01-25', returnDate: '2024-02-08', category: 'Programming' },
    { id: 11, bookTitle: 'Compilers: Principles, Techniques, and Tools', author: 'Aho et al.', isbnNo: '9780321486813', issueDate: '2024-03-05', returnDate: '2024-03-20', category: 'Computer Science' },
    { id: 12, bookTitle: 'Computer Architecture', author: 'Hennessy & Patterson', isbnNo: '9780123838728', issueDate: '2024-02-25', returnDate: '2024-03-11', category: 'Computer Architecture' },
  ];

  getAllBookHistory(): Observable<BookHistory[]> {
    return of(this.data);
  }

  addBookHistory(history: BookHistory): Observable<BookHistory> {
    history.id = Math.max(...this.data.map((h) => h.id)) + 1;
    this.data.unshift(history);
    return of(history);
  }

  updateBookHistory(history: BookHistory): Observable<BookHistory> {
    const index = this.data.findIndex((h) => h.id === history.id);
    if (index !== -1) {
      this.data[index] = history;
    }
    return of(history);
  }

  deleteBookHistory(id: number): Observable<boolean> {
    this.data = this.data.filter((h) => h.id !== id);
    return of(true);
  }
}
