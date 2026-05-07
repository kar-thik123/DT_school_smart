import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { CommonModule, DatePipe } from '@angular/common';
import { MailService, Mail } from '../../core/service/mail.service';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    CommonModule,
    DatePipe
  ]
})
export class InboxComponent implements OnInit {
  breadscrums = [
    {
      title: 'Inbox',
      items: ['Email'],
      active: 'Inbox',
    },
  ];

  mails: Mail[] = [];
  currentFolder: string = 'inbox';
  isLoading = false;

  constructor(private mailService: MailService) { }

  ngOnInit() {
    const folder = history.state?.folder || 'inbox';
    this.loadMails(folder);
  }

  loadMails(folder: string) {
    this.currentFolder = folder;
    this.isLoading = true;
    this.breadscrums[0].active = folder.charAt(0).toUpperCase() + folder.slice(1);

    this.mailService.getMailsByFolder(folder).subscribe({
      next: (data) => {
        this.mails = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load mails', err);
        this.isLoading = false;
      }
    });
  }

  toggleStar(mail: Mail) {
    const newValue = !mail.isStarred;
    mail.isStarred = newValue; // optimistic update
    this.mailService.updateMailAction(mail.id, 'star', newValue).subscribe({
      error: (err) => {
        mail.isStarred = !newValue; // revert on error
        console.error(err);
      }
    });
  }

  deleteMail(mail: Mail) {
    this.mailService.updateMailAction(mail.id, 'delete').subscribe({
      next: () => {
        this.mails = this.mails.filter(m => m.id !== mail.id);
      },
      error: (err) => console.error(err)
    });
  }

  archiveMail(mail: Mail) {
    this.mails = this.mails.filter(m => m.id !== mail.id); // optimistic
    this.mailService.updateMailAction(mail.id, 'archive').subscribe({
      error: (err) => {
        this.mails.push(mail); // revert on error
        console.error(err);
      }
    });
  }

  getBadgeClass(index: number): string {
    const classes = ['col-blue', 'col-red', 'col-cyan', 'col-orange', 'col-purple', 'col-green'];
    return classes[index % classes.length];
  }

  getBadgeText(index: number): string {
    const texts = ['Work', 'Shopping', 'Family', 'Office'];
    return texts[index % texts.length];
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  }
}
