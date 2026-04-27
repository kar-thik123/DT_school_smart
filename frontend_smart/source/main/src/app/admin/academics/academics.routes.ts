import { Route } from '@angular/router';
import { Page404Component } from 'app/authentication/page404/page404.component';

export const ACADEMICS_ROUTE: Route[] = [
  {
    path: 'academic-year',
    loadComponent: () =>
      import(
        './academic-year/all-academic-year.component'
      ).then((m) => m.AllAcademicYearComponent),
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./sessions/all-sessions.component').then(
        (m) => m.AllSessionsComponent
      ),
  },
  {
    path: 'classes',
    loadComponent: () =>
      import('./classes/all-classes.component').then(
        (m) => m.AllClassesComponent
      ),
  },
  {
    path: 'subjects',
    loadComponent: () =>
      import('./subjects/all-subjects.component').then(
        (m) => m.AllSubjectsComponent
      ),
  },
  {
    path: 'course-curriculum',
    loadComponent: () =>
      import(
        './course-curriculum/all-course-curriculum.component'
      ).then((m) => m.AllCourseCurriculumComponent),
  },
  {
    path: 'assignment',
    loadComponent: () =>
      import('./assignment/all-assignment.component').then(
        (m) => m.AllAssignmentComponent
      ),
  },
  {
    path: 'lesson-planning',
    loadComponent: () =>
      import(
        './lesson-planning/all-lesson-planning.component'
      ).then((m) => m.AllLessonPlanningComponent),
  },
  { path: '**', component: Page404Component },
];
