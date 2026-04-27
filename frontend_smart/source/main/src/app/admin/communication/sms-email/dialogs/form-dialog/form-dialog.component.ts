import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SmsEmailService } from '../../sms-email.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { SmsEmail } from '../../sms-email.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  smsEmail: SmsEmail;
}

@Component({
    selector: 'app-sms-email-form',
    templateUrl: './form-dialog.component.html',
    styleUrls: ['./form-dialog.component.scss'],
    providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
    imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatInputModule,
        MatDialogClose,
    ]
})
export class SmsEmailFormComponent {
  dialogRef = inject<MatDialogRef<SmsEmailFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  smsEmailService = inject(SmsEmailService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  smsEmailForm: UntypedFormGroup;
  smsEmail: SmsEmail;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? `${data.smsEmail.type} - ${data.smsEmail.subject || 'SMS'}`
        : 'New SMS / Email';
    this.smsEmail =
      this.action === 'edit'
        ? data.smsEmail
        : new SmsEmail({} as SmsEmail);

    this.smsEmailForm = this.createSmsEmailForm();
  }

  createSmsEmailForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.smsEmail.id],
      img: [this.smsEmail.img],
      type: [this.smsEmail.type, [Validators.required]],
      recipientGroup: [this.smsEmail.recipientGroup, [Validators.required]],
      recipient: [this.smsEmail.recipient, [Validators.required]],
      subject: [this.smsEmail.subject],
      message: [this.smsEmail.message, [Validators.required]],
      status: [this.smsEmail.status, [Validators.required]],
      sentBy: [this.smsEmail.sentBy, [Validators.required]],
      sentDate: [this.smsEmail.sentDate, [Validators.required]],
      deliveryStatus: [this.smsEmail.deliveryStatus, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.smsEmailForm.valid) {
      const formData = this.smsEmailForm.getRawValue();
      if (this.action === 'edit') {
        this.smsEmailService.updateSmsEmail(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.smsEmailService.addSmsEmail(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
          },
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  public confirmAdd(): void {
    this.submit();
  }
}
