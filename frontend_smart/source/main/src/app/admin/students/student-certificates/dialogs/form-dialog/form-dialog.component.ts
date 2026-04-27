import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentCertificateService } from '../../student-certificates.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { StudentCertificate } from '../../student-certificates.model';
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
  studentCertificate: StudentCertificate;
}

@Component({
    selector: 'app-student-certificate-form',
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
export class StudentCertificateFormComponent {
  dialogRef = inject<MatDialogRef<StudentCertificateFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentCertificateService = inject(StudentCertificateService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  studentCertificateForm: UntypedFormGroup;
  studentCertificate: StudentCertificate;

  constructor() {
    const data = this.data;

    // Set action and student certificate data
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.studentCertificate.student_name
        : 'New Student Certificate';
    this.studentCertificate =
      this.action === 'edit'
        ? data.studentCertificate
        : new StudentCertificate({} as StudentCertificate);

    // Create form
    this.studentCertificateForm = this.createStudentCertificateForm();
  }

  // Create form group for student certificate fields with validation
  createStudentCertificateForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.studentCertificate.id],
      img: [this.studentCertificate.img],
      student_name: [this.studentCertificate.student_name, [Validators.required]],
      certificate_type: [this.studentCertificate.certificate_type, [Validators.required]],
      certificate_no: [this.studentCertificate.certificate_no, [Validators.required]],
      issued_by: [this.studentCertificate.issued_by, [Validators.required]],
      issue_date: [this.studentCertificate.issue_date, [Validators.required]],
      expiry_date: [this.studentCertificate.expiry_date],
      category: [this.studentCertificate.category, [Validators.required]],
      description: [this.studentCertificate.description],
      status: [this.studentCertificate.status, [Validators.required]],
    });
  }

  // Handle form validation errors for user feedback
  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  // Submit form data
  submit(): void {
    if (this.studentCertificateForm.valid) {
      const formData = this.studentCertificateForm.getRawValue();
      if (this.action === 'edit') {
        this.studentCertificateService.updateStudentCertificate(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.studentCertificateService.addStudentCertificate(formData).subscribe({
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

  // Confirm and add the student certificate
  public confirmAdd(): void {
    this.submit();
  }
}
