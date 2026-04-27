import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentHealthRecordService } from '../../student-health-records.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { StudentHealthRecord } from '../../student-health-records.model';
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
  studentHealthRecord: StudentHealthRecord;
}

@Component({
    selector: 'app-student-health-record-form',
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
export class StudentHealthRecordFormComponent {
  dialogRef = inject<MatDialogRef<StudentHealthRecordFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentHealthRecordService = inject(StudentHealthRecordService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  studentHealthRecordForm: UntypedFormGroup;
  studentHealthRecord: StudentHealthRecord;

  constructor() {
    const data = this.data;

    // Set action and student health record data
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.studentHealthRecord.student_name
        : 'New Health Record';
    this.studentHealthRecord =
      this.action === 'edit'
        ? data.studentHealthRecord
        : new StudentHealthRecord({} as StudentHealthRecord);

    // Create form
    this.studentHealthRecordForm = this.createStudentHealthRecordForm();
  }

  // Create form group for student health record fields with validation
  createStudentHealthRecordForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.studentHealthRecord.id],
      img: [this.studentHealthRecord.img],
      student_name: [this.studentHealthRecord.student_name, [Validators.required]],
      blood_group: [this.studentHealthRecord.blood_group, [Validators.required]],
      allergies: [this.studentHealthRecord.allergies],
      last_checkup: [this.studentHealthRecord.last_checkup, [Validators.required]],
      status: [this.studentHealthRecord.status, [Validators.required]],
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
    if (this.studentHealthRecordForm.valid) {
      const formData = this.studentHealthRecordForm.getRawValue();
      if (this.action === 'edit') {
        this.studentHealthRecordService.updateStudentHealthRecord(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.studentHealthRecordService.addStudentHealthRecord(formData).subscribe({
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

  // Confirm and add the student health record
  public confirmAdd(): void {
    this.submit();
  }
}
