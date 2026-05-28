import { AuthGuard } from '@core/guard/auth.guard';
import { Page404Component } from '../authentication/page404/page404.component';
import { Route } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeworkComponent } from './homework/homework.component';
import { LeaveRequestComponent } from './leave-request/leave-request.component';
import { TimetableComponent } from './timetable/timetable.component';
import { SettingsComponent } from './settings/settings.component';
import { StudentClassComponent } from './student-class/student-class.component';
import { AboutStudentComponent } from 'app/admin/students/about-student/about-student.component';
import { NoticesComponent } from './notices/notices.component';
import { FeeDetailsComponent } from './fees/fee-details/fee-details.component';
import { FeeReceiptsComponent } from './fees/fee-receipts/fee-receipts.component';
import { DueFeesComponent } from './fees/due-fees/due-fees.component';
import { OnlinePaymentComponent } from './fees/online-payment/online-payment.component';
import { MyIssuedBooksComponent } from './library/my-issued-books/my-issued-books.component';
import { DueDatesComponent } from './library/due-dates/due-dates.component';
import { BookHistoryComponent } from './library/book-history/book-history.component';
import { MyRouteComponent } from './transport/my-route/my-route.component';
import { VehicleDetailsComponent } from './transport/vehicle-details/vehicle-details.component';
import { RoomDetailsComponent } from './hostel/room-details/room-details.component';
import { HostelFeesComponent } from './hostel/hostel-fees/hostel-fees.component';
import { ComplaintsComponent } from './hostel/complaints/complaints.component';
import { UpcomingExamsComponent } from './examination/upcoming-exams/upcoming-exams.component';
import { SyllabusComponent } from './academics/syllabus/syllabus.component';
import { AssignmentsComponent } from './academics/assignments/assignments.component';
import { StudyMaterialsComponent } from './academics/study-materials/study-materials.component';
import { AcademicCalendarComponent } from './academics/academic-calendar/academic-calendar.component';
import { McqComponent } from './academics/mcq/mcq.component';
import { MonthlySummaryComponent } from './attendance/monthly-summary/monthly-summary.component';
import { MyAttendanceComponent } from './attendance/my-attendance/my-attendance.component';
import { MySubjectsComponent } from './academics/my-subjects/my-subjects.component';
import { HallTicketComponent } from './examination/hall-ticket/hall-ticket.component';
import { MarksComponent } from './examination/marks/marks.component';
import { ReportCardComponent } from './examination/report-card/report-card.component';
import { ResultsComponent } from './examination/results/results.component';

export const STUDENT_ROUTE: Route[] = [
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'homework',
    component: HomeworkComponent,
  },
  {
    path: 'notices',
    component: NoticesComponent,
  },
  {
    path: 'leave-request',
    component: LeaveRequestComponent,
  },
  {
    path: 'timetable',
    component: TimetableComponent,
  },
  {
    path: 'my-class',
    component: StudentClassComponent,
  },
  {
    path: 'academics',
    children: [
      { path: 'syllabus', component: SyllabusComponent },
      { path: 'assignments', component: AssignmentsComponent },
      { path: 'study-materials', component: StudyMaterialsComponent },
      { path: 'academic-calendar', component: AcademicCalendarComponent },
      { path: 'my-subjects', component: MySubjectsComponent },
      { path: 'mcq', component: McqComponent, canActivate: [AuthGuard], data: { permission: 'MCQ:VIEW' } },
    ],
  },
  {
    path: 'attendance',
    children: [
      { path: 'monthly-summary', component: MonthlySummaryComponent },
      { path: 'my-attendance', component: MyAttendanceComponent },
    ],
  },
  {
    path: 'examination',
    children: [
      { path: 'exam-schedule', component: UpcomingExamsComponent },
      { path: 'hall-ticket', component: HallTicketComponent },
      { path: 'marks', component: MarksComponent },
      { path: 'report-card', component: ReportCardComponent },
      { path: 'results', component: ResultsComponent },
    ],
  },
  {
    path: 'fees',
    children: [
      { path: 'fee-details', component: FeeDetailsComponent },
      { path: 'fee-receipts', component: FeeReceiptsComponent },
      { path: 'due-fees', component: DueFeesComponent },
      { path: 'online-payment', component: OnlinePaymentComponent },
    ],
  },
  {
    path: 'library',
    children: [
      { path: 'my-issued-books', component: MyIssuedBooksComponent },
      { path: 'due-dates', component: DueDatesComponent },
      { path: 'book-history', component: BookHistoryComponent },
    ],
  },
  {
    path: 'transport',
    children: [
      { path: 'my-route', component: MyRouteComponent },
      { path: 'vehicle-details', component: VehicleDetailsComponent },
    ],
  },
  {
    path: 'hostel',
    children: [
      { path: 'room-details', component: RoomDetailsComponent },
      { path: 'hostel-fees', component: HostelFeesComponent },
      { path: 'complaints', component: ComplaintsComponent },
    ],
  },
  {
    path: 'profile',
    component: AboutStudentComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },
  { path: '**', component: Page404Component },
];
