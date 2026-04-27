import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { LessonPlanning } from './lesson-planning.model';

@Injectable({
  providedIn: 'root',
})
export class LessonPlanningService {
  private lessons: LessonPlanning[] = [
    { id: 1, topicName: 'Algebra Basics', lessonName: 'Introduction to Algebra', className: 'Class 1', subjectName: 'Mathematics', teacherName: 'John Doe', lessonDate: '2023-10-01', status: 'Completed', objectives: 'Understand basic algebra', teachingMethod: 'Lecture' },
    { id: 2, topicName: 'Plant Biology', lessonName: 'Photosynthesis Process', className: 'Class 2', subjectName: 'Science', teacherName: 'Jane Smith', lessonDate: '2023-10-02', status: 'In Progress', objectives: 'Learn photosynthesis', teachingMethod: 'Lab' },
    { id: 3, topicName: 'Literature', lessonName: 'Modern Poetry', className: 'Class 3', subjectName: 'English', teacherName: 'Alice Brown', lessonDate: '2023-10-03', status: 'Planned', objectives: 'Analyze modern poems', teachingMethod: 'Discussion' },
    { id: 4, topicName: 'World History', lessonName: 'The French Revolution', className: 'Class 4', subjectName: 'History', teacherName: 'Bob White', lessonDate: '2023-10-04', status: 'Completed', objectives: 'Revolution events', teachingMethod: 'Video' },
    { id: 5, topicName: 'Physical Geography', lessonName: 'World Map Basics', className: 'Class 5', subjectName: 'Geography', teacherName: 'Charlie Green', lessonDate: '2023-10-05', status: 'In Progress', objectives: 'Map identification', teachingMethod: 'Workshop' },
    { id: 6, topicName: 'Classical Mechanics', lessonName: 'Laws of Motion', className: 'Class 6', subjectName: 'Physics', teacherName: 'David Black', lessonDate: '2023-10-06', status: 'Planned', objectives: 'Newton laws', teachingMethod: 'Problem Solving' },
    { id: 7, topicName: 'Inorganic Chemistry', lessonName: 'Chemical Bonding', className: 'Class 7', subjectName: 'Chemistry', teacherName: 'Emma Watson', lessonDate: '2023-10-07', status: 'Completed', objectives: 'Bond types', teachingMethod: 'Lecture' },
    { id: 8, topicName: 'Human Biology', lessonName: 'Human Anatomy', className: 'Class 8', subjectName: 'Biology', teacherName: 'Frank Miller', lessonDate: '2023-10-08', status: 'In Progress', objectives: 'Body systems', teachingMethod: 'Presentation' },
    { id: 9, topicName: 'Intro to CS', lessonName: 'Algorithms and Flowcharts', className: 'Class 9', subjectName: 'Computer Science', teacherName: 'Grace Hopper', lessonDate: '2023-10-09', status: 'Planned', objectives: 'Flowchart design', teachingMethod: 'Coding' },
    { id: 10, topicName: 'Basic Economics', lessonName: 'Macroeconomics', className: 'Class 10', subjectName: 'Economics', teacherName: 'Henry Ford', lessonDate: '2023-10-10', status: 'Completed', objectives: 'Economic principles', teachingMethod: 'Seminar' },
    { id: 11, topicName: 'Social Science', lessonName: 'Social Psychology', className: 'Class 11', subjectName: 'Psychology', teacherName: 'Isabel Bloom', lessonDate: '2023-10-11', status: 'In Progress', objectives: 'Group behavior', teachingMethod: 'Case Study' },
    { id: 12, topicName: 'Political Science', lessonName: 'Global Politics', className: 'Class 12', subjectName: 'Political Science', teacherName: 'Jack Reacher', lessonDate: '2023-10-12', status: 'Planned', objectives: 'International relations', teachingMethod: 'Debate' },
  ];

  dataChange: BehaviorSubject<LessonPlanning[]> = new BehaviorSubject<
    LessonPlanning[]
  >([]);

  getAllLessons(): Observable<LessonPlanning[]> {
    this.dataChange.next(this.lessons);
    return of(this.lessons);
  }

  addLesson(lesson: LessonPlanning): Observable<LessonPlanning> {
    lesson.id = Math.max(...this.lessons.map(l => l.id), 0) + 1;
    this.lessons.push(lesson);
    this.dataChange.next(this.lessons);
    return of(lesson);
  }

  updateLesson(lesson: LessonPlanning): Observable<LessonPlanning> {
    const index = this.lessons.findIndex(l => l.id === lesson.id);
    if (index !== -1) {
      this.lessons[index] = lesson;
      this.dataChange.next(this.lessons);
    }
    return of(lesson);
  }

  deleteLesson(id: number): Observable<number> {
    this.lessons = this.lessons.filter(l => l.id !== id);
    this.dataChange.next(this.lessons);
    return of(id);
  }
}
