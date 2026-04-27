import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { OnlineApplicationService } from '../../online-applications.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { OnlineApplication } from '../../online-applications.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  onlineApplication: OnlineApplication;
}

@Component({
  selector: 'app-online-application-form',
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
    MatDatepickerModule,
    MatDialogClose,
  ]
})
export class OnlineApplicationFormComponent {
  dialogRef = inject<MatDialogRef<OnlineApplicationFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  onlineApplicationService = inject(OnlineApplicationService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  onlineApplicationForm: UntypedFormGroup;
  onlineApplication: OnlineApplication;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.onlineApplication.student_name
        : 'New Application';
    this.onlineApplication =
      this.action === 'edit'
        ? data.onlineApplication
        : new OnlineApplication({} as OnlineApplication);
    this.onlineApplicationForm = this.createOnlineApplicationForm();
  }

  createOnlineApplicationForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.onlineApplication.id],
      img: [this.onlineApplication.img],
      student_name: [this.onlineApplication.student_name, [Validators.required]],
      application_no: [this.onlineApplication.application_no, [Validators.required]],
      email: [this.onlineApplication.email, [Validators.required, Validators.email]],
      mobile: [this.onlineApplication.mobile, [Validators.required]],
      gender: [this.onlineApplication.gender, [Validators.required]],
      date_of_birth: [this.onlineApplication.date_of_birth, [Validators.required]],
      course: [this.onlineApplication.course, [Validators.required]],
      application_date: [this.onlineApplication.application_date, [Validators.required]],
      payment_status: [this.onlineApplication.payment_status, [Validators.required]],
      application_status: [this.onlineApplication.application_status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    } else if (control.hasError('email')) {
      return 'Not a valid email';
    }
    return '';
  }

  submit(): void {
    if (this.onlineApplicationForm.valid) {
      const formData = this.onlineApplicationForm.getRawValue();
      if (this.action === 'edit') {
        this.onlineApplicationService.updateOnlineApplication(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.onlineApplicationService.addOnlineApplication(formData).subscribe({
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
