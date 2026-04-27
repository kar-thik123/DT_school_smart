import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MyDocument } from './document.model';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private httpClient = inject(HttpClient);

  private readonly mockData: MyDocument[] = [
    { id: 1, name: 'Aadhar Card', type: 'ID Proof', uploadDate: '2025-12-26', size: '1.2 MB', fileUrl: 'link' },
    { id: 2, name: 'Degree Certificate', type: 'Degree', uploadDate: '2025-12-25', size: '2.5 MB', fileUrl: 'link' },
    { id: 3, name: 'Joining Letter', type: 'Contract', uploadDate: '2025-12-24', size: '800 KB', fileUrl: 'link' },
    { id: 4, name: 'B.Ed Certificate', type: 'Certificate', uploadDate: '2025-12-23', size: '1.5 MB', fileUrl: 'link' },
    { id: 5, name: 'Experience Letter', type: 'Contract', uploadDate: '2025-12-22', size: '1.1 MB', fileUrl: 'link' },
    { id: 6, name: 'PAN Card', type: 'ID Proof', uploadDate: '2025-12-21', size: '900 KB', fileUrl: 'link' },
    { id: 7, name: 'M.Sc Degree', type: 'Degree', uploadDate: '2025-12-20', size: '2.8 MB', fileUrl: 'link' },
    { id: 8, name: 'Medical Certificate', type: 'Certificate', uploadDate: '2025-12-19', size: '1.3 MB', fileUrl: 'link' },
    { id: 9, name: 'Passport', type: 'ID Proof', uploadDate: '2025-12-18', size: '3.5 MB', fileUrl: 'link' },
    { id: 10, name: 'Training Certificate', type: 'Certificate', uploadDate: '2025-12-17', size: '1.0 MB', fileUrl: 'link' },
    { id: 11, name: 'Address Proof', type: 'ID Proof', uploadDate: '2025-12-16', size: '1.4 MB', fileUrl: 'link' },
    { id: 12, name: 'Employment Contract', type: 'Contract', uploadDate: '2025-12-15', size: '2.0 MB', fileUrl: 'link' },
  ];

  getDocuments(): Observable<MyDocument[]> {
    return of(this.mockData);
  }

  addDocument(document: MyDocument): Observable<MyDocument> {
    // If a file object is provided, create a URL for it
    if (document.file) {
      document.fileUrl = URL.createObjectURL(document.file);
    }
    this.mockData.unshift(document);
    return of(document);
  }

  updateDocument(document: MyDocument): Observable<MyDocument> {
    const index = this.mockData.findIndex((it) => it.id === document.id);
    if (index !== -1) {
      // If a file object is provided, create a URL for it
      if (document.file) {
        document.fileUrl = URL.createObjectURL(document.file);
      }
      this.mockData[index] = document;
    }
    return of(document);
  }

  deleteDocument(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }
}
