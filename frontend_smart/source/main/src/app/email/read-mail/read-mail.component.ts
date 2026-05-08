import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { Mail, MailService } from '../../core/service/mail.service';

@Component({
  selector: 'app-read-mail',
  templateUrl: './read-mail.component.html',
  styleUrls: ['./read-mail.component.scss'],
  imports: [BreadcrumbComponent, CommonModule, DatePipe, RouterLink, MatIconModule, MatButtonModule, MatCheckboxModule]
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

  currentUserId: string;

  constructor(private router: Router, private mailService: MailService, private authService: AuthService) {
    this.currentUserId = this.authService.currentUserValue?.id;
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      if (navigation.extras.state['mail']) {
        this.mail = navigation.extras.state['mail'];
        this.folder = navigation.extras.state['folder'] || 'inbox';
      } else if (navigation.extras.state['mailId']) {
        // We only have the ID (e.g. from a notification), we'll fetch it in ngOnInit
        this.folder = navigation.extras.state['folder'] || 'inbox';
      }
    }
  }

  ngOnInit() {
    if (!this.mail) {
      const state = history.state;
      if (state && state.mailId) {
        this.mailService.getMailById(state.mailId).subscribe({
          next: (mail) => {
            this.mail = mail;
            this.processReadState();
          },
          error: () => this.router.navigate(['/email/inbox'])
        });
        return;
      }

      // Fallback: If page is refreshed, state is lost, redirect to inbox
      this.router.navigate(['/email/inbox']);
      return;
    }
    
    this.processReadState();
  }

  private processReadState() {
    if (!this.mail) return;
    // Auto-mark as read when opening the email
    if (!this.mail.isRead && this.folder === 'inbox') {
      this.mailService.updateMailAction(this.mail.id, 'read', true).subscribe({
        next: () => { if (this.mail) this.mail.isRead = true; }
      });
    }
  }

  getDisplayName(): string {
    if (!this.mail) return '';
    if (this.folder === 'sent' || this.folder === 'drafts') return this.mail.receiver.name;
    if (this.folder === 'trash' && this.mail.senderId === this.currentUserId) return this.mail.receiver.name;
    return this.mail.sender.name;
  }

  getDisplayEmail(): string {
    if (!this.mail) return '';
    if (this.folder === 'sent' || this.folder === 'drafts') return this.mail.receiver.email;
    if (this.folder === 'trash' && this.mail.senderId === this.currentUserId) return this.mail.receiver.email;
    return this.mail.sender.email;
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
    this.mailService.updateMailAction(this.mail.id, 'delete', undefined, this.folder).subscribe({
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
