import { Component, OnInit, inject } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

interface NotificationSettingGroup {
  category: string;
  icon: string;
  settings: {
    id: string;
    label: string;
    description: string;
    email: boolean;
    sms: boolean;
    internal: boolean;
  }[];
}

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatCardModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    FormsModule
  ],
})
export class NotificationSettingsComponent implements OnInit {
  private snackBar = inject(MatSnackBar);

  breadscrums = [{ title: 'Notification Settings', items: ['Settings'], active: 'Notification Settings' }];

  notificationGroups: NotificationSettingGroup[] = [
    {
      category: 'Academic Notifications',
      icon: 'school',
      settings: [
        { id: 'att_alert', label: 'Attendance Alert', description: 'Notify parents when student is absent.', email: true, sms: true, internal: true },
        { id: 'exam_res', label: 'Exam Results', description: 'Notify when exam results are published.', email: true, sms: false, internal: true },
        { id: 'homework', label: 'Homework Assigned', description: 'Daily notification for new assignments.', email: false, sms: false, internal: true },
      ]
    },
    {
      category: 'Financial Notifications',
      icon: 'payments',
      settings: [
        { id: 'fee_rem', label: 'Fee Reminders', description: 'Send reminders for upcoming fee dues.', email: true, sms: true, internal: true },
        { id: 'pay_conf', label: 'Payment Confirmation', description: 'Sent after successful fee payment.', email: true, sms: true, internal: false },
        { id: 'salary_cred', label: 'Salary Credit', description: 'Notify staff when salary is credited.', email: true, sms: true, internal: true },
      ]
    },
    {
      category: 'System & Security',
      icon: 'security',
      settings: [
        { id: 'login_alert', label: 'New Login Alert', description: 'Alert for logins from new devices.', email: true, sms: false, internal: false },
        { id: 'pwd_change', label: 'Password Change', description: 'Confirm password change operations.', email: true, sms: true, internal: true },
        { id: 'sys_maint', label: 'System Maintenance', description: 'Alerts for scheduled downtime.', email: true, sms: false, internal: true },
      ]
    }
  ];

  saveSettings() {
    console.log('Notification Settings Saved:', this.notificationGroups);
    this.snackBar.open('Notification Settings Updated Successfully!', '', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: 'snackbar-success',
    });
  }

  ngOnInit() {}
}
