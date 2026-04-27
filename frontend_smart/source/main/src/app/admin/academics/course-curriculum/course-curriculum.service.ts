import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CourseCurriculum } from './course-curriculum.model';

@Injectable({
  providedIn: 'root',
})
export class CourseCurriculumService {
  private curriculums: CourseCurriculum[] = [
    { id: 1, courseName: 'Algebra Basics', className: 'Class 1', subjectName: 'Mathematics', description: 'Introduction to variables and equations.', status: 'Active', duration: '4 weeks', referenceMaterial: 'NCERT Mathematics' },
    { id: 2, courseName: 'Photosynthesis', className: 'Class 2', subjectName: 'Science', description: 'Understanding how plants make food.', status: 'Active', duration: '2 weeks', referenceMaterial: 'Science Today' },
    { id: 3, courseName: 'Essay Writing', className: 'Class 3', subjectName: 'English', description: 'Techniques for effective writing.', status: 'Active', duration: '3 weeks', referenceMaterial: 'English Grammar' },
    { id: 4, courseName: 'Ancient Civilizations', className: 'Class 4', subjectName: 'History', description: 'Study of early human societies.', status: 'Inactive', duration: '5 weeks', referenceMaterial: 'History World' },
    { id: 5, courseName: 'Map Reading', className: 'Class 5', subjectName: 'Geography', description: 'Basics of cartography and map use.', status: 'Active', duration: '2 weeks', referenceMaterial: 'Geography Atlas' },
    { id: 6, courseName: 'Newton Laws', className: 'Class 6', subjectName: 'Physics', description: 'Fundamental laws of motion.', status: 'Active', duration: '4 weeks', referenceMaterial: 'Concepts of Physics' },
    { id: 7, courseName: 'Periodic Table', className: 'Class 7', subjectName: 'Chemistry', description: 'Exploring chemical elements.', status: 'Active', duration: '3 weeks', referenceMaterial: 'Chemistry Lab Manual' },
    { id: 8, courseName: 'Cell Structure', className: 'Class 8', subjectName: 'Biology', description: 'The building blocks of life.', status: 'Active', duration: '3 weeks', referenceMaterial: 'Modern Biology' },
    { id: 9, courseName: 'Python Basics', className: 'Class 9', subjectName: 'Computer Science', description: 'Introduction to programming with Python.', status: 'Active', duration: '6 weeks', referenceMaterial: 'Python for Beginners' },
    { id: 10, courseName: 'Supply and Demand', className: 'Class 10', subjectName: 'Economics', description: 'Market forces and pricing.', status: 'Active', duration: '4 weeks', referenceMaterial: 'Economics Today' },
    { id: 11, courseName: 'Behavioral Science', className: 'Class 11', subjectName: 'Psychology', description: 'Study of human behavior.', status: 'Inactive', duration: '5 weeks', referenceMaterial: 'Psychology Overview' },
    { id: 12, courseName: 'Democracy', className: 'Class 12', subjectName: 'Political Science', description: 'Principles of democratic governance.', status: 'Active', duration: '4 weeks', referenceMaterial: 'Civics and Government' },
  ];

  dataChange: BehaviorSubject<CourseCurriculum[]> = new BehaviorSubject<CourseCurriculum[]>(
    []
  );

  getAllCurriculums(): Observable<CourseCurriculum[]> {
    this.dataChange.next(this.curriculums);
    return of(this.curriculums);
  }

  addCurriculum(curriculum: CourseCurriculum): Observable<CourseCurriculum> {
    curriculum.id = Math.max(...this.curriculums.map(c => c.id), 0) + 1;
    this.curriculums.push(curriculum);
    this.dataChange.next(this.curriculums);
    return of(curriculum);
  }

  updateCurriculum(curriculum: CourseCurriculum): Observable<CourseCurriculum> {
    const index = this.curriculums.findIndex(c => c.id === curriculum.id);
    if (index !== -1) {
      this.curriculums[index] = curriculum;
      this.dataChange.next(this.curriculums);
    }
    return of(curriculum);
  }

  deleteCurriculum(id: number): Observable<number> {
    this.curriculums = this.curriculums.filter(c => c.id !== id);
    this.dataChange.next(this.curriculums);
    return of(id);
  }
}
