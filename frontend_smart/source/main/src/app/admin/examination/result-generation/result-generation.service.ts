import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  ResultGeneration,
  ResultGenerationData,
} from './result-generation.model';

@Injectable({
  providedIn: 'root',
})
export class ResultGenerationService {
  private readonly staticData: any[] = [
    new ResultGeneration({
      id: 1,
      exam_name: 'Mid-Term Jan 2024',
      course: 'B.Tech',
      semester: 'Sem 1',
      result_date: '2024-02-15',
      status: 'Published',
    }),
    new ResultGeneration({
      id: 2,
      exam_name: 'Mid-Term Jan 2024',
      course: 'MBA',
      semester: 'Sem 2',
      result_date: '2024-02-20',
      status: 'Published',
    }),
    new ResultGeneration({
      id: 3,
      exam_name: 'Final Exam May 2024',
      course: 'B.Com',
      semester: 'Sem 3',
      result_date: '2024-06-10',
      status: 'Pending',
    }),
    new ResultGeneration({
      id: 4,
      exam_name: 'Entrance Test 2024',
      course: 'All',
      semester: 'N/A',
      result_date: '2024-04-05',
      status: 'Published',
    }),
    new ResultGeneration({
      id: 5,
      exam_name: 'Internal Assessment 1',
      course: 'B.Tech',
      semester: 'Sem 4',
      result_date: '2024-02-05',
      status: 'Published',
    }),
    new ResultGeneration({
      id: 6,
      exam_name: 'Quarterly Exam',
      course: 'School',
      semester: 'Class 10',
      result_date: '2024-07-01',
      status: 'Pending',
    }),
  ];

  dataChange: BehaviorSubject<ResultGeneration[]> = new BehaviorSubject<
    ResultGeneration[]
  >([]);

  constructor() {}

  get data(): ResultGeneration[] {
    return this.dataChange.value;
  }

  getAllResultGenerations(): Observable<ResultGeneration[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addResultGeneration(
    resultGeneration: ResultGeneration
  ): Observable<ResultGeneration> {
    this.staticData.push(resultGeneration);
    this.dataChange.next(this.staticData);
    return of(resultGeneration);
  }

  updateResultGeneration(
    resultGeneration: ResultGeneration
  ): Observable<ResultGeneration> {
    const index = this.staticData.findIndex(
      (it) => it.id === resultGeneration.id
    );
    if (index !== -1) {
      this.staticData[index] = resultGeneration;
      this.dataChange.next(this.staticData);
    }
    return of(resultGeneration);
  }

  deleteResultGeneration(id: number): Observable<number> {
    const index = this.staticData.findIndex((it) => it.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }

  deleteMultipleResultGenerations(ids: number[]): Observable<number[]> {
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
