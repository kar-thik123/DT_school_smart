import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgxEditorModule, Toolbar, Editor } from 'ngx-editor';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { Router, RouterLink } from '@angular/router';
import { Observable, debounceTime, distinctUntilChanged, switchMap, of, filter } from 'rxjs';
import { MailService, MailUser } from '../../core/service/mail.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compose',
  templateUrl: './compose.component.html',
  styleUrls: ['./compose.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    BreadcrumbComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxEditorModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    RouterLink,
    CommonModule
  ]
})
export class ComposeComponent implements OnInit, OnDestroy {
  breadscrums = [
    {
      title: 'Compose',
      items: ['Email'],
      active: 'Compose',
    },
  ];
  receiverControl = new FormControl<string | MailUser>('');
  filteredUsers$: Observable<MailUser[]> = of([]);

  subject = '';
  replyToId: string | null = null;
  replyToData: any = null;
  selectedFiles: File[] = [];
  isUploading = false;

  constructor(
    private mailService: MailService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['replyTo']) {
      this.replyToData = navigation.extras.state['replyTo'];
    }
  }

  editor?: Editor;
  html = '';
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  ngOnInit(): void {
    this.editor = new Editor();

    // Pre-fill if this is a reply
    if (this.replyToData) {
      this.replyToId = this.replyToData.id;
      this.subject = this.replyToData.subject.startsWith('Re: ') ? this.replyToData.subject : `Re: ${this.replyToData.subject}`;
      const replyUser: MailUser = {
        id: this.replyToData.senderId,
        name: this.replyToData.senderName,
        email: this.replyToData.senderEmail
      };
      this.receiverControl.setValue(replyUser);
    }

    this.filteredUsers$ = this.receiverControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(query => typeof query === 'string'),
      switchMap(query => {
        if (!query) return of([]);
        return this.mailService.searchUsers(query as string);
      })
    );
  }

  displayUser(user: MailUser): string {
    return user && user.name ? `${user.name} <${user.email}>` : '';
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.push(files[i]);
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  sendMail() {
    const selectedUser = this.receiverControl.value;
    if (!selectedUser || typeof selectedUser === 'string') {
      this.snackBar.open('Please select a valid recipient from the suggestions.', 'Close', { duration: 3000 });
      return;
    }
    if (!this.subject.trim()) {
      this.snackBar.open('Please enter a subject.', 'Close', { duration: 3000 });
      return;
    }

    const plainTextBody = this.stripHtml(this.html);

    const formData = new FormData();
    formData.append('receiverId', selectedUser.id);
    formData.append('subject', this.subject);
    formData.append('body', plainTextBody);
    formData.append('status', 'SENT');
    if (this.replyToId) {
      formData.append('replyToId', this.replyToId);
    }
    this.selectedFiles.forEach(file => {
      formData.append('attachments', file, file.name);
    });

    this.isUploading = true;
    this.mailService.sendMail(formData).subscribe({
      next: () => {
        this.isUploading = false;
        this.snackBar.open('Email sent successfully!', 'Close', { duration: 3000, panelClass: 'bg-green' });
        this.router.navigate(['/email/inbox']);
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Error sending mail:', err);
        this.snackBar.open('Failed to send email. Please try again.', 'Close', { duration: 3000, panelClass: 'bg-red' });
      }
    });
  }

  discard() {
    this.receiverControl.reset();
    this.subject = '';
    this.html = '';
    this.selectedFiles = [];
    this.router.navigate(['/email/inbox']);
  }

  // make sure to destroy the editor
  ngOnDestroy(): void {
    this.editor?.destroy();
  }
}
