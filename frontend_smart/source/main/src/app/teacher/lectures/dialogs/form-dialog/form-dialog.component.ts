import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LecturesService } from '../../lectures.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { Lectures } from '../../lectures.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  lectures: Lectures;
}

@Component({
  selector: 'app-lecture-form',
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
  ],
})
export class LectureFormComponent {
  dialogRef = inject<MatDialogRef<LectureFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  lecturesService = inject(LecturesService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  lecturesForm: UntypedFormGroup;
  lectures: Lectures;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.lectures.subjectName : 'New Lecture';
    this.lectures = this.action === 'edit' ? data.lectures : new Lectures({});
    this.lecturesForm = this.createLecturesForm();
  }

  // Create the lectures form with required validators
  createLecturesForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.lectures.id],
      subjectName: [this.lectures.subjectName, [Validators.required]],
      class: [this.lectures.class, [Validators.required]],
      date: [this.lectures.date, [Validators.required]],
      time: [this.lectures.time, [Validators.required]],
      status: [this.lectures.status, [Validators.required]],
      teacher_id: [this.lectures.teacher_id, [Validators.required]],
      subject_id: [this.lectures.subject_id, [Validators.required]],
      student_group: [this.lectures.student_group, [Validators.required]],
      duration: [this.lectures.duration, [Validators.required]],
      location: [this.lectures.location, [Validators.required]],
      attendance_count: [this.lectures.attendance_count, [Validators.required]],
      created_at: [this.lectures.created_at],
      updated_at: [this.lectures.updated_at],
      reason_for_cancellation: [this.lectures.reason_for_cancellation],
    });
  }

  // Handle error messages for form controls
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data, handle edit or add based on action type
  submit(): void {
    if (this.lecturesForm.valid) {
      const formData = this.lecturesForm.getRawValue();
      formData.date = formatDate(this.lecturesForm.value.date, 'yyyy-MM-dd', 'en-US');

      if (this.action === 'edit') {
        this.lecturesService.updateLectures(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.lecturesService.addLectures(formData).subscribe({
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

  // Close dialog without any actions
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Trigger submit method on confirmation
  public confirmAdd(): void {
    this.submit();
  }
}
