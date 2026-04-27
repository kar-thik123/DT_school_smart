import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { StudyMaterial } from './study-material.model';

@Injectable({
  providedIn: 'root',
})
export class StudyMaterialService {
  private httpClient = inject(HttpClient);

  private readonly mockData: StudyMaterial[] = [
    { id: 1, class: '10A', subject: 'Mathematics', title: 'Algebra Notes', type: 'PDF', uploadDate: '2025-12-26', fileUrl: 'link' },
    { id: 2, class: '11B', subject: 'Physics', title: 'Newtonian Mechanics', type: 'Video', uploadDate: '2025-12-26', fileUrl: 'link' },
    { id: 3, class: '12C', subject: 'Chemistry', title: 'Organic Reaction Mechanisms', type: 'PPT', uploadDate: '2025-12-25', fileUrl: 'link' },
    { id: 4, class: '10B', subject: 'Biology', topic: 'Plant Cell structure', type: 'Doc', uploadDate: '2025-12-25', fileUrl: 'link' },
    { id: 5, class: '9A', subject: 'English', topic: 'Poetry Appreciation', type: 'PDF', uploadDate: '2025-12-24', fileUrl: 'link' },
    { id: 6, class: '11A', subject: 'History', topic: 'The Great War', type: 'PPT', uploadDate: '2025-12-24', fileUrl: 'link' },
    { id: 7, class: '12B', subject: 'Geography', topic: 'River Systems', type: 'PDF', uploadDate: '2025-12-23', fileUrl: 'link' },
    { id: 8, class: '9B', subject: 'PE', topic: 'Rules of Football', type: 'PDF', uploadDate: '2025-12-23', fileUrl: 'link' },
    { id: 9, class: '10A', subject: 'Mathematics', topic: 'Trigonometry Formulas', type: 'PDF', uploadDate: '2025-12-22', fileUrl: 'link' },
    { id: 10, class: '11B', subject: 'Physics', topic: 'Electric Circuits', type: 'Video', uploadDate: '2025-12-22', fileUrl: 'link' },
    { id: 11, class: '12C', subject: 'Chemistry', topic: 'Periodic Table Trends', type: 'PPT', uploadDate: '2025-12-21', fileUrl: 'link' },
    { id: 12, class: '10B', subject: 'Biology', topic: 'Evolutionary theory', type: 'Doc', uploadDate: '2025-12-21', fileUrl: 'link' },
  ].map(item => ({ ...item, title: (item as any).title || (item as any).topic })); // fix title/topic mismatch in mock data generation

  getAllStudyMaterials(): Observable<StudyMaterial[]> {
    return of(this.mockData);
  }

  addMaterial(material: StudyMaterial): Observable<StudyMaterial> {
    this.mockData.unshift(material);
    return of(material);
  }

  updateMaterial(material: StudyMaterial): Observable<StudyMaterial> {
    const index = this.mockData.findIndex((it) => it.id === material.id);
    if (index !== -1) {
      this.mockData[index] = material;
    }
    return of(material);
  }

  deleteMaterial(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }

}

