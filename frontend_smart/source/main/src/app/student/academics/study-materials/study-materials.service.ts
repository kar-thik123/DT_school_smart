import { Injectable } from '@angular/core';
import { StudyMaterial } from './study-materials.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StudyMaterialsService {
  private data: StudyMaterial[] = [
    { id: 1, title: 'Algebra Notes', subject: 'Mathematics', type: 'PDF', date: '2024-01-05', downloadUrl: 'algebra.pdf' },
    { id: 2, title: 'Quantum Mechanics Basics', subject: 'Physics', type: 'Video', date: '2024-01-10', downloadUrl: 'quantum.mp4' },
    { id: 3, title: 'Organic Chemistry Chart', subject: 'Chemistry', type: 'Image', date: '2024-01-12', downloadUrl: 'organic.jpg' },
    { id: 4, title: 'Genetics Summary', subject: 'Biology', type: 'PDF', date: '2024-01-15', downloadUrl: 'genetics.pdf' },
    { id: 5, title: 'Shakespeare Plays Analysis', subject: 'English', type: 'DOC', date: '2024-01-18', downloadUrl: 'shakespeare.doc' },
    { id: 6, title: 'World War II Timeline', subject: 'History', type: 'PDF', date: '2024-01-20', downloadUrl: 'ww2.pdf' },
    { id: 7, title: 'Climate Change Report', subject: 'Geography', type: 'PDF', date: '2024-01-22', downloadUrl: 'climate.pdf' },
    { id: 8, title: 'Data Structures Guide', subject: 'Computer Science', type: 'PDF', date: '2024-01-25', downloadUrl: 'ds.pdf' },
    { id: 9, title: 'Macroeconomics Principles', subject: 'Economics', type: 'PPT', date: '2024-01-28', downloadUrl: 'macro.ppt' },
    { id: 10, title: 'Art History Overview', subject: 'Art', type: 'PDF', date: '2024-02-01', downloadUrl: 'art.pdf' },
    { id: 11, title: 'Music Theory Basics', subject: 'Music', type: 'PDF', date: '2024-02-05', downloadUrl: 'music.pdf' },
    { id: 12, title: 'Physical Education Routine', subject: 'P.E.', type: 'Video', date: '2024-02-08', downloadUrl: 'pe.mp4' },
  ];

  getAllStudyMaterials(): Observable<StudyMaterial[]> {
    return of(this.data);
  }

  addStudyMaterial(material: StudyMaterial): Observable<StudyMaterial> {
    material.id = Math.max(...this.data.map((d) => d.id)) + 1;
    this.data.push(material);
    return of(material);
  }

  updateStudyMaterial(material: StudyMaterial): Observable<StudyMaterial> {
    const index = this.data.findIndex((d) => d.id === material.id);
    if (index !== -1) {
      this.data[index] = material;
    }
    return of(material);
  }

  deleteStudyMaterial(id: number): Observable<boolean> {
    this.data = this.data.filter((d) => d.id !== id);
    return of(true);
  }
}
