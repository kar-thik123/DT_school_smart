import { ExamScheduleComponent } from './examination/exam-schedule/exam-schedule.component';
import { LecturesComponent } from './lectures/lectures.component';
import { Page404Component } from '../authentication/page404/page404.component';
import { Route } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeaveRequestComponent } from './leave-request/leave-request.component';
import { SettingsComponent } from './settings/settings.component';
import { MyClassesComponent } from './academics/my-classes/my-classes.component';
import { SubjectsTaughtComponent } from './academics/subjects-taught/subjects-taught.component';
import { AboutTeacherComponent } from 'app/admin/teachers/about-teacher/about-teacher.component';
import { LessonPlansComponent } from './academics/lesson-plans/lesson-plans.component';
import { StudyMaterialsComponent } from './academics/study-materials/study-materials.component';
import { AssignmentsComponent } from './academics/assignments/assignments.component';
import { ClassStudentsComponent } from './students/class-students/class-students.component';
import { StudentProfilesComponent } from './students/student-profiles/student-profiles.component';
import { StudentAttendanceComponent } from './students/student-attendance/student-attendance.component';
import { StudentPerformanceComponent } from './students/student-performance/student-performance.component';
import { MarksEntryComponent } from './examination/marks-entry/marks-entry.component';
import { GradeSubmissionComponent } from './examination/grade-submission/grade-submission.component';
import { ResultPreviewComponent } from './examination/result-preview/result-preview.component';
import { MyTimetableComponent } from './timetable/my-timetable/my-timetable.component';
import { SubstitutionRequestsComponent } from './timetable/substitution-requests/substitution-requests.component';
import { NoticesComponent } from './communication/notices/notices.component';
import { MessagesComponent } from './communication/messages/messages.component';
import { AnnouncementsComponent } from './communication/announcements/announcements.component';
import { DailyAttendanceComponent } from './attendance/daily-attendance/daily-attendance.component';
import { ApplyLeaveComponent } from './leave/apply-leave/apply-leave.component';
import { LeaveStatusComponent } from './leave/leave-status/leave-status.component';
import { MyProfileComponent } from './profile/my-profile/my-profile.component';
import { DocumentsComponent } from './profile/documents/documents.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { AttendanceSummaryComponent } from './attendance/attendance-summary/attendance-summary.component';
import { TodayScheduleComponent } from './today-schedule/today-schedule.component';

export const TEACHER_ROUTE: Route[] = [
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  { path: 'today-schedule', component: TodayScheduleComponent },
  {
    path: 'academics',
    children: [
      { path: 'my-classes', component: MyClassesComponent },
      { path: 'my-subjects', component: SubjectsTaughtComponent },
      { path: 'lesson-plans', component: LessonPlansComponent },
      { path: 'study-materials', component: StudyMaterialsComponent },
      { path: 'assignments', component: AssignmentsComponent },
    ],
  },
  {
    path: 'students',
    children: [
      { path: 'class-students', component: ClassStudentsComponent },
      { path: 'student-profiles', component: StudentProfilesComponent },
      { path: 'student-attendance', component: StudentAttendanceComponent },
      { path: 'student-performance', component: StudentPerformanceComponent },
    ],
  },
  {
    path: 'examination',
    children: [
      { path: 'exam-schedule', component: ExamScheduleComponent },
      { path: 'marks-entry', component: MarksEntryComponent },
      { path: 'grade-submission', component: GradeSubmissionComponent },
      { path: 'result-preview', component: ResultPreviewComponent },
    ],
  },
  {
    path: 'timetable',
    children: [
      { path: 'my-timetable', component: MyTimetableComponent },
      {
        path: 'substitution-requests',
        component: SubstitutionRequestsComponent,
      },
    ],
  },
  {
    path: 'communication',
    children: [
      { path: 'notices', component: NoticesComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'announcements', component: AnnouncementsComponent },
    ],
  },
  {
    path: 'attendance',
    children: [
      { path: 'daily-attendance', component: DailyAttendanceComponent },
      { path: 'attendance-summary', component: AttendanceSummaryComponent },
    ],
  },
  {
    path: 'leave',
    children: [
      { path: 'apply-leave', component: ApplyLeaveComponent },
      { path: 'leave-status', component: LeaveStatusComponent },
    ],
  },
  {
    path: 'my-profile',
    children: [
      { path: 'profile-info', component: MyProfileComponent },
      { path: 'documents', component: DocumentsComponent },
      { path: 'change-password', component: ChangePasswordComponent },
    ],
  },
  { path: 'lectures', component: LecturesComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', component: Page404Component },
];
