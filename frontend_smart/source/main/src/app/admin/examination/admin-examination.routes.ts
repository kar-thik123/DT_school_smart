import { Route } from '@angular/router';
import { ExamTypesComponent } from './exam-types/exam-types.component';
import { ExamScheduleComponent } from './exam-schedule/exam-schedule.component';
import { HallAllocationComponent } from './hall-allocation/hall-allocation.component';
import { MarksEntryComponent } from './marks-entry/marks-entry.component';
import { ResultGenerationComponent } from './result-generation/result-generation.component';
import { ReportCardsComponent } from './report-cards/report-cards.component';
import { Page404Component } from 'app/authentication/page404/page404.component';
import { StudentExamResultComponent } from './student-exam-result/student-exam-result.component';

export const ADMIN_EXAMINATION_ROUTE: Route[] = [
  {
    path: '',
    redirectTo: 'exam-types',
    pathMatch: 'full'
  },
  {
    path: 'exam-types',
    component: ExamTypesComponent,
  },
  {
    path: 'student-exam-result',
    component: StudentExamResultComponent,
  },
  {
    path: 'exam-schedule',
    component: ExamScheduleComponent,
  },
  {
    path: 'hall-allocation',
    component: HallAllocationComponent,
  },
  {
    path: 'marks-entry',
    component: MarksEntryComponent,
  },
  {
    path: 'result-generation',
    component: ResultGenerationComponent,
  },
  {
    path: 'report-cards',
    component: ReportCardsComponent,
  },
  { path: '**', component: Page404Component },
];
