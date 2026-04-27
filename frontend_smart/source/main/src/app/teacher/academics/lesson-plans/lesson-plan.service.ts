import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { LessonPlan } from './lesson-plan.model';

@Injectable({
  providedIn: 'root',
})
export class LessonPlanService {
  private httpClient = inject(HttpClient);

  private readonly mockData: LessonPlan[] = [
    { id: 1, class: '10A', subject: 'Mathematics', topic: 'Algebraic Expressions', date: '2025-12-26', status: 'Planned', lessonDetails: 'Intro to variables' },
    { id: 2, class: '11B', subject: 'Physics', topic: 'Thermodynamics', date: '2025-12-26', status: 'In Progress', lessonDetails: 'Laws of thermodynamics' },
    { id: 3, class: '12C', subject: 'Chemistry', topic: 'Organic Compounds', date: '2025-12-27', status: 'Planned', lessonDetails: 'Functional groups' },
    { id: 4, class: '10B', subject: 'Biology', topic: 'Cell Division', date: '2025-12-27', status: 'Planned', lessonDetails: 'Mitosis and Meiosis' },
    { id: 5, class: '9A', subject: 'English', topic: 'Figures of Speech', date: '2025-12-28', status: 'Planned', lessonDetails: 'Metaphor and Simile' },
    { id: 6, class: '11A', subject: 'History', topic: 'French Revolution', date: '2025-12-28', status: 'Completed', lessonDetails: 'Causes of revolution' },
    { id: 7, class: '12B', subject: 'Geography', topic: 'Plate Tectonics', date: '2025-12-29', status: 'Planned', lessonDetails: 'Continental drift' },
    { id: 8, class: '9B', subject: 'PE', topic: 'Volleyball Drills', date: '2025-12-29', status: 'Planned', lessonDetails: 'Serving techniques' },
    { id: 9, class: '10A', subject: 'Mathematics', topic: 'Geometry', date: '2025-12-30', status: 'Planned', lessonDetails: 'Theorems on circles' },
    { id: 10, class: '11B', subject: 'Physics', topic: 'Optics', date: '2025-12-30', status: 'Planned', lessonDetails: 'Reflection and Refraction' },
    { id: 11, class: '12C', subject: 'Chemistry', topic: 'Kinetics', date: '2025-12-31', status: 'Planned', lessonDetails: 'Rate of reaction' },
    { id: 12, class: '10B', subject: 'Biology', topic: 'Genetics', date: '2025-12-31', status: 'Planned', lessonDetails: 'Mendellian laws' },
  ];

  getAllLessonPlans(): Observable<LessonPlan[]> {
    return of(this.mockData);
  }

  addLessonPlan(plan: LessonPlan): Observable<LessonPlan> {
    this.mockData.unshift(plan);
    return of(plan);
  }

  updateLessonPlan(plan: LessonPlan): Observable<LessonPlan> {
    const index = this.mockData.findIndex((it) => it.id === plan.id);
    if (index !== -1) {
      this.mockData[index] = plan;
    }
    return of(plan);
  }

  deleteLessonPlan(id: number): Observable<number> {
    const index = this.mockData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.mockData.splice(index, 1);
    }
    return of(id);
  }

}

