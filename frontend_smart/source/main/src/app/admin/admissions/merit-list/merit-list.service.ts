import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MeritList } from './merit-list.model';

@Injectable({
  providedIn: 'root',
})
export class MeritListService {
  dataChange: BehaviorSubject<MeritList[]> = new BehaviorSubject<MeritList[]>([]);

  private staticData: any[] = [
    { id: 1, student_name: 'John Doe', application_no: 'APP001', category: 'General', entrance_score: 85, academic_score: 90, total_score: 175, rank: 1, course: 'Computer Science', selection_status: 'Selected', getRandomID: () => 1 },
    { id: 2, student_name: 'Jane Smith', application_no: 'APP002', category: 'OBC', entrance_score: 82, academic_score: 88, total_score: 170, rank: 2, course: 'Computer Science', selection_status: 'Selected', getRandomID: () => 2 },
    { id: 3, student_name: 'Mike Ross', application_no: 'APP003', category: 'General', entrance_score: 80, academic_score: 85, total_score: 165, rank: 3, course: 'Law', selection_status: 'Selected', getRandomID: () => 3 },
    { id: 4, student_name: 'Rachel Zane', application_no: 'APP004', category: 'SC', entrance_score: 78, academic_score: 82, total_score: 160, rank: 4, course: 'Law', selection_status: 'Waiting', getRandomID: () => 4 },
    { id: 5, student_name: 'Harvey Specter', application_no: 'APP005', category: 'General', entrance_score: 90, academic_score: 95, total_score: 185, rank: 1, course: 'Economics', selection_status: 'Selected', getRandomID: () => 5 },
    { id: 6, student_name: 'Donna Paulsen', application_no: 'APP006', category: 'General', entrance_score: 88, academic_score: 92, total_score: 180, rank: 2, course: 'Management', selection_status: 'Selected', getRandomID: () => 6 },
    { id: 7, student_name: 'Louis Litt', application_no: 'APP007', category: 'General', entrance_score: 75, academic_score: 80, total_score: 155, rank: 10, course: 'Finance', selection_status: 'Waiting', getRandomID: () => 7 },
    { id: 8, student_name: 'Jessica Pearson', application_no: 'APP008', category: 'General', entrance_score: 92, academic_score: 96, total_score: 188, rank: 1, course: 'Political Science', selection_status: 'Selected', getRandomID: () => 8 },
    { id: 9, student_name: 'Oliver Queen', application_no: 'APP009', category: 'ST', entrance_score: 70, academic_score: 75, total_score: 145, rank: 5, course: 'Mechanical Eng', selection_status: 'Selected', getRandomID: () => 9 },
    { id: 10, student_name: 'Barry Allen', application_no: 'APP010', category: 'OBC', entrance_score: 86, academic_score: 89, total_score: 175, rank: 1, course: 'Physics', selection_status: 'Selected', getRandomID: () => 10 },
    { id: 11, student_name: 'Iris West', application_no: 'APP011', category: 'General', entrance_score: 80, academic_score: 84, total_score: 164, rank: 3, course: 'Journalism', selection_status: 'Selected', getRandomID: () => 11 },
    { id: 12, student_name: 'Cisco Ramon', application_no: 'APP012', category: 'SC', entrance_score: 76, academic_score: 78, total_score: 154, rank: 4, course: 'Electrical Eng', selection_status: 'Waiting', getRandomID: () => 12 },
  ];

  get data(): MeritList[] {
    return this.dataChange.value;
  }

  getAllMeritLists(): Observable<MeritList[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addMeritList(meritList: MeritList): Observable<MeritList> {
    this.staticData.push(meritList);
    this.dataChange.next(this.staticData);
    return of(meritList);
  }

  updateMeritList(meritList: MeritList): Observable<MeritList> {
    const index = this.staticData.findIndex((item) => item.id === meritList.id);
    if (index !== -1) {
      this.staticData[index] = meritList;
      this.dataChange.next(this.staticData);
    }
    return of(meritList);
  }

  deleteMeritList(id: number): Observable<number> {
    const index = this.staticData.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
