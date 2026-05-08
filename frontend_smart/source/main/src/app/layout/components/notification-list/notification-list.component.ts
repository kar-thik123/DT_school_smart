import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FeatherIconsComponent } from '@shared/components/feather-icons/feather-icons.component';
import { NgScrollbar } from 'ngx-scrollbar';
import { trigger, transition, style, animate } from '@angular/animations';

import { Notification } from '@core/service/notification.service';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
  imports: [
    MatMenuModule,
    NgScrollbar,
    FeatherIconsComponent,
    CommonModule,
    MatButtonModule,
  ],
  animations: [
    trigger('notificationAnimation', [
      transition(':leave', [
        animate(
          '0.5s ease-out',
          style({ opacity: 0, transform: 'translateX(30px)' })
        ),
      ]),
    ]),
  ],
})
export class NotificationListComponent implements OnInit, OnChanges {
  @Input() notifications: Notification[] = [];
  @Output() markAllAsRead = new EventEmitter<void>();
  @Output() readAll = new EventEmitter<void>();
  @Output() closeNotification = new EventEmitter<Notification>();
  @Output() actionClick = new EventEmitter<{
    notification: Notification;
    actionType: string;
  }>();

  // Track notifications being removed for animation
  removingNotification: Notification | null = null;

  // Count of unread notifications
  unreadCount = 0;

  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  ngOnInit() {
    this.updateUnreadCount();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['notifications']) {
      this.updateUnreadCount();
    }
  }

  // Update the unread count based on notification status
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(
      (n) => !n.isRead
    ).length;
  }

  markAll() {
    this.markAllAsRead.emit();
    // Local optimistic update
    this.notifications.forEach((notification) => {
      notification.isRead = true;
    });
    this.updateUnreadCount();
  }

  readAllNotifications() {
    this.readAll.emit();
    this.updateUnreadCount();
  }

  removeNotification(notification: Notification) {
    // Set the notification as being removed for animation
    this.removingNotification = notification;

    // Mark as read first if unread
    if (!notification.isRead) {
      notification.isRead = true;
      this.updateUnreadCount();
    }

    // Emit after a short delay to allow animation to complete
    setTimeout(() => {
      this.closeNotification.emit(notification);
      this.removingNotification = null;
    }, 500);
  }

  // Check if a notification is currently being removed
  isRemoving(notification: Notification): boolean {
    return this.removingNotification === notification;
  }

  // Mark notification as read when clicked
  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      notification.isRead = true;
      this.updateUnreadCount();
      // Emit the action so parent can call API, we use a custom action type 'mark-read'
      this.actionClick.emit({ notification, actionType: 'mark-read' });
    } else {
      // If already read, but clicked, emit 'view'
      this.actionClick.emit({ notification, actionType: 'view' });
    }
  }

  // Handle action button click
  onActionClick(notification: Notification) {
    this.actionClick.emit({
      notification,
      actionType: 'view',
    });

    // If the notification is unread, mark it as read when action is clicked
    if (!notification.isRead) {
      notification.isRead = true;
      this.updateUnreadCount();
    }

    if (this.menuTrigger) {
      this.menuTrigger.closeMenu();
    }
  }

  onMarkAsReadButtonClick(notification: Notification) {
    if (!notification.isRead) {
      notification.isRead = true;
      this.updateUnreadCount();
      this.actionClick.emit({ notification, actionType: 'mark-read' });
    }
  }
}
