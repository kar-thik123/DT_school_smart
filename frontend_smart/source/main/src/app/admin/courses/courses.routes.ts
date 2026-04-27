import { AllCourseComponent } from './all-course/all-course.component';
import { AddCourseComponent } from './add-course/add-course.component';
import { EditCourseComponent } from './edit-course/edit-course.component';
import { AboutCourseComponent } from './about-course/about-course.component';
import { Route } from '@angular/router';
import { Page404Component } from 'app/authentication/page404/page404.component';

export const COURSE_ROUTE: Route[] = [
  {
    path: 'all-courses',
    component: AllCourseComponent,
  },
  {
    path: 'add-course',
    component: AddCourseComponent,
  },
  {
    path: 'edit-course',
    component: EditCourseComponent,
  },
  {
    path: 'about-course',
    component: AboutCourseComponent,
  },
  { path: '**', component: Page404Component },
];
