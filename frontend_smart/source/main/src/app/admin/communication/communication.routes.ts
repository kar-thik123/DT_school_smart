import { Route } from '@angular/router';
import { NoticeBoardComponent } from './notice-board/notice-board.component';
import { AnnouncementsComponent } from './announcements/announcements.component';
import { SmsEmailComponent } from './sms-email/sms-email.component';
import { Page404Component } from 'app/authentication/page404/page404.component';

export const COMMUNICATION_ROUTE: Route[] = [
  {
    path: 'notice-board',
    component: NoticeBoardComponent,
  },
  {
    path: 'announcements',
    component: AnnouncementsComponent,
  },
  {
    path: 'sms-email',
    component: SmsEmailComponent,
  },
  { path: '**', component: Page404Component },
];
