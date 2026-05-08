import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { Mail, MailService } from '../../core/service/mail.service';

@Component({
  selector: 'app-read-mail',
  templateUrl: './read-mail.component.html',
  styleUrls: ['./read-mail.component.scss'],
  imports: [BreadcrumbComponent, CommonModule, DatePipe, RouterLink]
})
export class ReadMailComponent implements OnInit {
  breadcrumbs = [
    {
      title: 'Read',
      items: ['Email'],
      active: 'Read',
    },
  ];

  mail: Mail | null = null;
  folder: string = 'inbox';

  constructor(private router: Router, private mailService: MailService) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.mail = navigation.extras.state['mail'];
      this.folder = navigation.extras.state['folder'];
    }
  }

  ngOnInit() {
    if (!this.mail) {
      // Fallback: If page is refreshed, state is lost, redirect to inbox
      this.router.navigate(['/email/inbox']);
      return;
    }
    // Auto-mark as read when opening the email
    if (!this.mail.isRead && this.folder === 'inbox') {
      this.mailService.updateMailAction(this.mail.id, 'read', true).subscribe({
        next: () => { if (this.mail) this.mail.isRead = true; }
      });
    }
  }

  getDisplayName(): string {
    if (!this.mail) return '';
    return this.folder === 'sent' || this.folder === 'drafts' ? this.mail.receiver.name : this.mail.sender.name;
  }

  getDisplayEmail(): string {
    if (!this.mail) return '';
    return this.folder === 'sent' || this.folder === 'drafts' ? this.mail.receiver.email : this.mail.sender.email;
  }

  toggleStar() {
    if (!this.mail) return;
    const newValue = !this.mail.isStarred;
    this.mail.isStarred = newValue;
    this.mailService.updateMailAction(this.mail.id, 'star', newValue).subscribe({
      error: () => { if (this.mail) this.mail.isStarred = !newValue; }
    });
  }

  deleteMail() {
    if (!this.mail) return;
    this.mailService.updateMailAction(this.mail.id, 'delete').subscribe({
      next: () => this.router.navigate(['/email/inbox']),
      error: (err) => console.error(err)
    });
  }

  archiveMail() {
    if (!this.mail) return;
    this.mailService.updateMailAction(this.mail.id, 'archive').subscribe({
      next: () => this.router.navigate(['/email/inbox']),
      error: (err) => console.error(err)
    });
  }

  replyToMail() {
    if (!this.mail) return;
    this.router.navigate(['/email/compose'], {
      state: {
        replyTo: {
          id: this.mail.id,
          senderName: this.mail.sender.name,
          senderEmail: this.mail.sender.email,
          senderId: this.mail.senderId,
          subject: this.mail.subject,
          body: this.mail.body,
          date: this.mail.created_at,
        }
      }
    });
  }

  isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
