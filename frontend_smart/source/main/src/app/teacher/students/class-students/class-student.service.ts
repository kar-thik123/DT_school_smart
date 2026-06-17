import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassStudent } from './class-student.model';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ClassStudentService {
  private httpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllStudents(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.apiUrl}/student-enrollments`).pipe(
      map(enrollments => enrollments.map(e => ({
        id: e.student.id,
        rollNo: e.student.roll_number || '',
        name: e.student.name || '',
        gender: e.student.student_profile?.gender || '',
        parentName: e.student.student_profile?.father_name || e.student.student_profile?.mother_name || '',
        mobile: e.student.student_profile?.primary_mobile || '',
        email: e.student.email || '',
        address: e.student.student_profile?.current_address || ''
      })))
    );
  }

  addStudent(student: ClassStudent): Observable<ClassStudent> {
    return this.httpClient.post<ClassStudent>(`${this.apiUrl}/student-enrollments`, student);
  }

  updateStudent(student: ClassStudent): Observable<ClassStudent> {
    return this.httpClient.put<ClassStudent>(`${this.apiUrl}/student-enrollments/${student.id}`, student);
  }

  deleteStudent(id: number): Observable<number> {
    return this.httpClient.delete<number>(`${this.apiUrl}/student-enrollments/${id}`);
  }
}

