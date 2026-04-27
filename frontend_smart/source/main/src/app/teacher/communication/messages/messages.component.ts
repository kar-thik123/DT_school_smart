import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
})
export class MessagesComponent {
  private fb = inject(UntypedFormBuilder);
  messageForm: UntypedFormGroup;

  breadscrums = [
    {
      title: 'Send Messages',
      items: ['Teacher', 'Communication'],
      active: 'Messages',
    },
  ];

  constructor() {
    this.messageForm = this.fb.group({
      recipientType: ['student', [Validators.required]],
      recipientName: ['', [Validators.required]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required]],
    });
  }

  onSend() {
    console.log('Sending message:', this.messageForm.value);
  }
}
