import { MatToolbarModule } from '@angular/material/toolbar';
import { NgClass } from '@angular/common';
import { Component, ElementRef, OnInit, Renderer2, DOCUMENT, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfigService } from '@config';
import {
  AuthService,
  InConfiguration,
  LanguageService,
  RightSidebarService
} from '@core';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { LocalStorageService } from '@shared/services';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationListComponent } from '../components/notification-list/notification-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { LanguageListComponent } from '../components/language-list/language-list.component';
import { UserProfileMenuComponent } from '../components/user-profile-menu/user-profile-menu.component';

import { Notification, NotificationService } from '@core/service/notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    RouterLink,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    NotificationListComponent,
    MatMenuModule,
    // LanguageListComponent,
    UserProfileMenuComponent,
  ],
})
export class HeaderComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit {
  private document = inject<Document>(DOCUMENT);
  private renderer = inject(Renderer2);
  elementRef = inject(ElementRef);
  private rightSidebarService = inject(RightSidebarService);
  private configService = inject(ConfigService);
  private authService = inject(AuthService);
  private router = inject(Router);
  languageService = inject(LanguageService);
  private localStorageService = inject(LocalStorageService);

  public config!: InConfiguration;
  userImg?: string;
  homePage?: string;
  isNavbarCollapsed = true;
  flagvalue: string | string[] | undefined;
  countryName: string | string[] = [];
  langStoreValue?: string;
  defaultFlag?: string;
  isOpenSidebar?: boolean;
  docElement?: HTMLElement;
  isFullScreen = false;

  listLang = [
    { text: 'English', flag: 'assets/images/flags/us.svg', lang: 'en' },
    { text: 'Spanish', flag: 'assets/images/flags/spain.svg', lang: 'es' },
    { text: 'German', flag: 'assets/images/flags/germany.svg', lang: 'de' },
  ];
  private notificationService = inject(NotificationService);

  notifications: Notification[] = [];
  ngOnInit() {
    this.config = this.configService.configData;
    this.userImg =
      './assets/images/user/' + this.authService.currentUserValue.avatar;
    this.docElement = document.documentElement;

    if (this.authService.hasPermission('IDENTITY', 'IS_SUPER_ADMIN') || this.authService.hasPermission('IDENTITY', 'IS_MANAGEMENT') || this.authService.hasPermission('IDENTITY', 'IS_SYSTEM_ADMIN')) {
      this.homePage = 'admin/dashboard/main';
    } else if (this.authService.hasPermission('IDENTITY', 'IS_TEACHER')) {
      this.homePage = 'teacher/dashboard';
    } else if (this.authService.hasPermission('IDENTITY', 'IS_STUDENT')) {
      this.homePage = 'student/dashboard';
    } else {
      this.homePage = 'admin/dashboard/main';
    }

    this.langStoreValue = this.localStorageService.get('lang') as string;
    const val = this.listLang.filter((x) => x.lang === this.langStoreValue);
    this.countryName = val.map((element) => element.text);
    if (val.length === 0) {
      if (this.flagvalue === undefined) {
        this.defaultFlag = 'assets/images/flags/us.svg';
      }
    } else {
      this.flagvalue = val.map((element) => element.flag);
    }

    // Connect to notification socket & fetch initial data
    this.notificationService.connectSocket();
    this.notificationService.loadNotifications();
    this.subs.sink = this.notificationService.notifications$.subscribe(
      (notifs) => (this.notifications = notifs)
    );
  }

  onMarkAllNotificationsRead() {
    this.subs.sink = this.notificationService.markAllAsRead().subscribe();
  }

  onReadAllNotifications() {
    // We could navigate to a dedicated notifications page here if needed
  }

  onRemoveNotification(notification: Notification) {
    this.subs.sink = this.notificationService.deleteNotification(notification.id).subscribe();
  }

  onNotificationActionClick(event: {
    notification: Notification;
    actionType: string;
  }) {
    const { notification, actionType } = event;

    if (actionType === 'mark-read') {
      this.subs.sink = this.notificationService.markAsRead(notification.id).subscribe();
    } else if (actionType === 'view' && notification.type === 'email') {
      // Mark as read and open email
      if (!notification.isRead) {
        this.subs.sink = this.notificationService.markAsRead(notification.id).subscribe();
      }
      // Force reload by navigating away and back quickly
      this.router.navigateByUrl('/email/inbox', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/email/read-mail'], {
          state: { mailId: notification.referenceId }
        });
      });
    }
  }

  callFullscreen() {
    if (!this.isFullScreen) {
      if (this.docElement?.requestFullscreen != null) {
        this.docElement?.requestFullscreen();
      }
    } else {
      document.exitFullscreen();
    }
    this.isFullScreen = !this.isFullScreen;
  }
  setLanguage(text: string, lang: string, flag: string) {
    this.countryName = text;
    this.flagvalue = flag;
    this.langStoreValue = lang;
    this.languageService.setLanguage(lang);
  }
  mobileMenuSidebarOpen(event: Event, className: string) {
    const hasClass = (event.target as HTMLInputElement).classList.contains(
      className
    );
    if (hasClass) {
      this.renderer.removeClass(this.document.body, className);
    } else {
      this.renderer.addClass(this.document.body, className);
    }
  }
  callSidemenuCollapse() {
    const hasClass = this.document.body.classList.contains('side-closed');
    if (hasClass) {
      this.renderer.removeClass(this.document.body, 'side-closed');
      this.renderer.removeClass(this.document.body, 'submenu-closed');
      this.localStorageService.set('collapsed_menu', 'false');
    } else {
      this.renderer.addClass(this.document.body, 'side-closed');
      this.renderer.addClass(this.document.body, 'submenu-closed');
      this.localStorageService.set('collapsed_menu', 'true');
    }
  }
  logout() {
    this.subs.sink = this.authService.logout().subscribe((res) => {
      if (res.success) {
        this.router.navigate(['/authentication/signin']);
      }
    });
  }

  onLanguageChange(item: { text: string; flag: string; lang: string }) {
    this.countryName = item.text;
    this.flagvalue = item.flag;
    this.langStoreValue = item.lang;
    this.languageService.setLanguage(item.lang);
    this.localStorageService.set('lang', item.lang);
  }

  onAccountClicked() {
    this.router.navigate(['/extra-pages/profile']);
  }

  onInboxClicked() {
    this.router.navigate(['/email/inbox']);
  }

  onSettingsClicked() {
    this.router.navigate(['/extra-pages/faqs']);
  }
}
