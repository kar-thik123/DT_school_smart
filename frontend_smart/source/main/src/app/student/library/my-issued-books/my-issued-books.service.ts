import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MyIssuedBook } from './my-issued-books.model';

@Injectable({
  providedIn: 'root',
})
export class MyIssuedBooksService {
  private data: MyIssuedBook[] = [
    { id: 1, bookTitle: 'Introduction to Algorithms', author: 'Cormen et al.', isbnNo: '9780262033848', issueDate: '2025-01-10', dueDate: '2025-01-25', returnDate: '2025-01-24', status: 'Returned' },
    { id: 2, bookTitle: 'Clean Code', author: 'Robert C. Martin', isbnNo: '9780132350884', issueDate: '2025-02-01', dueDate: '2025-02-15', returnDate: '', status: 'Issued' },
    { id: 3, bookTitle: 'Design Patterns', author: 'Gamma et al.', isbnNo: '9780201633610', issueDate: '2025-01-05', dueDate: '2025-01-20', returnDate: '2025-01-22', status: 'Overdue' },
    { id: 4, bookTitle: 'The Pragmatic Programmer', author: 'Hunt & Thomas', isbnNo: '9780135957059', issueDate: '2025-02-10', dueDate: '2025-02-25', returnDate: '', status: 'Issued' },
    { id: 5, bookTitle: 'Artificial Intelligence', author: 'Russell & Norvig', isbnNo: '9780134610993', issueDate: '2025-01-15', dueDate: '2025-01-30', returnDate: '2025-01-29', status: 'Returned' },
    { id: 6, bookTitle: 'Database System Concepts', author: 'Silberschatz et al.', isbnNo: '9780073523323', issueDate: '2025-02-15', dueDate: '2025-03-01', returnDate: '', status: 'Issued' },
    { id: 7, bookTitle: 'Computer Networks', author: 'Tanenbaum', isbnNo: '9780132126953', issueDate: '2025-01-20', dueDate: '2025-02-04', returnDate: '2025-02-03', status: 'Returned' },
    { id: 8, bookTitle: 'Operating System Concepts', author: 'Silberschatz', isbnNo: '9781118063330', issueDate: '2025-03-01', dueDate: '2025-03-15', returnDate: '', status: 'Issued' },
    { id: 9, bookTitle: 'Modern Operating Systems', author: 'Tanenbaum', isbnNo: '9780133591620', issueDate: '2025-02-20', dueDate: '2025-03-06', returnDate: '', status: 'Issued' },
    { id: 10, bookTitle: 'The C Programming Language', author: 'Kernighan & Ritchie', isbnNo: '9780131103627', issueDate: '2025-01-25', dueDate: '2025-02-09', returnDate: '2025-02-08', status: 'Returned' },
    { id: 11, bookTitle: 'Compilers: Principles, Techniques, and Tools', author: 'Aho et al.', isbnNo: '9780321486813', issueDate: '2025-03-05', dueDate: '2025-03-20', returnDate: '', status: 'Issued' },
    { id: 12, bookTitle: 'Computer Architecture', author: 'Hennessy & Patterson', isbnNo: '9780123838728', issueDate: '2025-02-25', dueDate: '2025-03-11', returnDate: '', status: 'Issued' },
  ];

  getAllIssuedBooks(): Observable<MyIssuedBook[]> {
    return of(this.data);
  }

  addIssuedBook(book: MyIssuedBook): Observable<MyIssuedBook> {
    book.id = Math.max(...this.data.map((b) => b.id)) + 1;
    this.data.unshift(book);
    return of(book);
  }

  updateIssuedBook(book: MyIssuedBook): Observable<MyIssuedBook> {
    const index = this.data.findIndex((b) => b.id === book.id);
    if (index !== -1) {
      this.data[index] = book;
    }
    return of(book);
  }

  deleteIssuedBook(id: number): Observable<boolean> {
    this.data = this.data.filter((b) => b.id !== id);
    return of(true);
  }
}
