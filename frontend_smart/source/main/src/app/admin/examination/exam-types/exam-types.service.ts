import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ExamType } from './exam-types.model';

@Injectable({
  providedIn: 'root',
})
export class ExamTypesService {
  private readonly staticData: any[] = [
    {
      id: 1,
      exam_name: 'Internal Assessment 1',
      exam_code: 'IA1',
      description: 'First internal assessment for semester',
      status: 'Active',
    },
    {
      id: 2,
      exam_name: 'Internal Assessment 2',
      exam_code: 'IA2',
      description: 'Second internal assessment for semester',
      status: 'Active',
    },
    {
      id: 3,
      exam_name: 'Mid-Term Examination',
      exam_code: 'MTE',
      description: 'Mid-semester examination',
      status: 'Active',
    },
    {
      id: 4,
      exam_name: 'End-Term Examination',
      exam_code: 'ETE',
      description: 'Final semester examination',
      status: 'Active',
    },
    {
      id: 5,
      exam_name: 'Practical Examination',
      exam_code: 'PRC',
      description: 'Practical/Lab assessment',
      status: 'Active',
    },
    {
      id: 6,
      exam_name: 'Viva Voce',
      exam_code: 'VVA',
      description: 'Oral examination',
      status: 'Active',
    },
    {
      id: 7,
      exam_name: 'Special Supplementary',
      exam_code: 'SUP',
      description: 'Backlog/Supplementary exam',
      status: 'Inactive',
    },
    {
      id: 8,
      exam_name: 'Entrance Test',
      exam_code: 'ENT',
      description: 'Admission entrance test',
      status: 'Active',
    },
    {
      id: 9,
      exam_name: 'Aptitude Test',
      exam_code: 'APT',
      description: 'General aptitude assessment',
      status: 'Active',
    },
    {
      id: 10,
      exam_name: 'Quarterly Exam',
      exam_code: 'QTR',
      description: 'Quarterly school assessment',
      status: 'Active',
    },
    {
      id: 11,
      exam_name: 'Half Yearly Exam',
      exam_code: 'HYE',
      description: 'Mid-year school assessment',
      status: 'Active',
    },
    {
      id: 12,
      exam_name: 'Annual Exam',
      exam_code: 'ANN',
      description: 'Final year school assessment',
      status: 'Active',
    },
  ];

  dataChange: BehaviorSubject<ExamType[]> = new BehaviorSubject<ExamType[]>([]);

  constructor() {}

  get data(): ExamType[] {
    return this.dataChange.value;
  }

  getAllExamTypes(): Observable<ExamType[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addExamType(examType: ExamType): Observable<ExamType> {
    this.staticData.push(examType);
    this.dataChange.next(this.staticData);
    return of(examType);
  }

  updateExamType(examType: ExamType): Observable<ExamType> {
    const index = this.staticData.findIndex((it) => it.id === examType.id);
    if (index !== -1) {
      this.staticData[index] = examType;
      this.dataChange.next(this.staticData);
    }
    return of(examType);
  }

  deleteExamType(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }

  deleteMultipleExamTypes(ids: number[]): Observable<number[]> {
    ids.forEach((id) => {
      const index = this.staticData.findIndex((it) => it.id === id);
      if (index !== -1) {
        this.staticData.splice(index, 1);
      }
    });
    this.dataChange.next(this.staticData);
    return of(ids);
  }
}
