import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AdmissionEnquiryService } from '../../admission-enquiries.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AdmissionEnquiry } from '../../admission-enquiries.model';
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
  admissionEnquiry: AdmissionEnquiry;
}

@Component({
  selector: 'app-admission-enquiry-form',
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
export class AdmissionEnquiryFormComponent {
  dialogRef = inject<MatDialogRef<AdmissionEnquiryFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  admissionEnquiryService = inject(AdmissionEnquiryService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  admissionEnquiryForm: UntypedFormGroup;
  admissionEnquiry: AdmissionEnquiry;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.admissionEnquiry.student_name
        : 'New Admission Enquiry';
    this.admissionEnquiry =
      this.action === 'edit'
        ? data.admissionEnquiry
        : new AdmissionEnquiry({} as AdmissionEnquiry);
    this.admissionEnquiryForm = this.createAdmissionEnquiryForm();
  }

  createAdmissionEnquiryForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.admissionEnquiry.id],
      student_name: [this.admissionEnquiry.student_name, [Validators.required]],
      mobile: [this.admissionEnquiry.mobile, [Validators.required]],
      email: [this.admissionEnquiry.email, [Validators.email]],
      address: [this.admissionEnquiry.address],
      enquiry_date: [this.admissionEnquiry.enquiry_date, [Validators.required]],
      last_follow_up: [this.admissionEnquiry.last_follow_up],
      next_follow_up: [this.admissionEnquiry.next_follow_up],
      course: [this.admissionEnquiry.course, [Validators.required]],
      source: [this.admissionEnquiry.source],
      assigned_to: [this.admissionEnquiry.assigned_to],
      status: [this.admissionEnquiry.status, [Validators.required]],
      note: [this.admissionEnquiry.note],
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
    if (this.admissionEnquiryForm.valid) {
      const formData = this.admissionEnquiryForm.getRawValue();
      if (this.action === 'edit') {
        this.admissionEnquiryService.updateAdmissionEnquiry(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.admissionEnquiryService.addAdmissionEnquiry(formData).subscribe({
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
