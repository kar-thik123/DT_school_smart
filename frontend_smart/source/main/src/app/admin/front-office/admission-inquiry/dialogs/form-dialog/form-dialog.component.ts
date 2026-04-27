import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionInquiry } from '../../admission-inquiry.model';
import { AdmissionInquiryService } from '../../admission-inquiry.service';
import { formatDate } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  admissionInquiry: AdmissionInquiry;
}

@Component({
  selector: 'app-admission-inquiry-form',
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
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatDialogClose,
  ],
})
export class AdmissionInquirysFormComponent {
  dialogRef = inject<MatDialogRef<AdmissionInquirysFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  admissionInquiryService = inject(AdmissionInquiryService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  admissionInquiryForm: UntypedFormGroup;
  admissionInquiry: AdmissionInquiry;

  constructor() {
    const data = this.data;

    // Set action and admissionInquiry data
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.admissionInquiry.guardianName
        : 'New Inquiry';
    this.admissionInquiry =
      this.action === 'edit'
        ? data.admissionInquiry
        : new AdmissionInquiry({} as AdmissionInquiry);

    // Create form
    this.admissionInquiryForm = this.createAdmissionInquiryForm();
  }

  // Create form group for admissionInquiry fields with validation
  createAdmissionInquiryForm(): UntypedFormGroup {
    return this.fb.group({
      inquiryId: [this.admissionInquiry.inquiryId],
      img: [this.admissionInquiry.img],
      studentName: [
        this.admissionInquiry.studentName,
        [Validators.required, Validators.maxLength(100)],
      ],
      guardianName: [
        this.admissionInquiry.guardianName,
        [Validators.required, Validators.maxLength(100)],
      ],
      contactNumber: [
        this.admissionInquiry.contactNumber,
        [Validators.required, Validators.maxLength(15)],
      ],
      emailAddress: [
        this.admissionInquiry.emailAddress,
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      dateOfInquiry: [
        formatDate(this.admissionInquiry.dateOfInquiry, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      programOfInterest: [
        this.admissionInquiry.programOfInterest,
        [Validators.required, Validators.maxLength(100)],
      ],
      preferredStartDate: [
        formatDate(
          this.admissionInquiry.preferredStartDate,
          'yyyy-MM-dd',
          'en'
        ),
        [Validators.required],
      ],
      inquirySource: [
        this.admissionInquiry.inquirySource || 'Direct',
        [Validators.required, Validators.maxLength(50)],
      ],
      status: [
        this.admissionInquiry.status || 'New',
        [Validators.required, Validators.maxLength(50)],
      ],
      notes: [this.admissionInquiry.notes, [Validators.maxLength(1000)]],
      followUpDate: [
        formatDate(this.admissionInquiry.followUpDate, 'yyyy-MM-dd', 'en'),
      ],
      assignedTo: [
        this.admissionInquiry.assignedTo,
        [Validators.maxLength(100)],
      ],
      campusLocation: [
        this.admissionInquiry.campusLocation,
        [Validators.maxLength(100)],
      ],
      previousEducation: [
        this.admissionInquiry.previousEducation,
        [Validators.maxLength(500)],
      ],
    });
  }

  // Handle form validation errors for user feedback
  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('email')) {
      return 'Invalid email format';
    }
    return '';
  }

  // Submit form data
  submit(): void {
    if (this.admissionInquiryForm.valid) {
      const formData = this.admissionInquiryForm.getRawValue();
      if (this.action === 'edit') {
        this.admissionInquiryService
          .updateAdmissionInquiry(formData)
          .subscribe({
            next: (response) => {
              this.dialogRef.close(response);
            },
            error: (error) => {
              console.error('Update Error:', error);
            },
          });
      } else {
        this.admissionInquiryService.addAdmissionInquiry(formData).subscribe({
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

  // Close the dialog without submitting
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Confirm and add the admissionInquiry
  public confirmAdd(): void {
    this.submit();
  }
}
