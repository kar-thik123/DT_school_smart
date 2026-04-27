import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { GradeSubmissionService } from '../../grade-submission.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { GradeSubmission } from '../../grade-submission.model';
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
  gradeSubmission: GradeSubmission;
}

@Component({
  selector: 'app-grade-submission-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  standalone: true,
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
export class GradeSubmissionFormComponent {
  dialogRef = inject<MatDialogRef<GradeSubmissionFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  gradeService = inject(GradeSubmissionService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  gradeForm: UntypedFormGroup;
  gradeSubmission: GradeSubmission;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Submission: ${this.data.gradeSubmission.studentName}`;
      this.gradeSubmission = this.data.gradeSubmission;
    } else {
      this.dialogTitle = 'New Grade Submission';
      this.gradeSubmission = {} as GradeSubmission;
    }
    this.gradeForm = this.createGradeForm();
  }

  createGradeForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.gradeSubmission.id],
      rollNo: [this.gradeSubmission.rollNo, [Validators.required]],
      studentName: [this.gradeSubmission.studentName, [Validators.required]],
      averageMarks: [this.gradeSubmission.averageMarks, [Validators.required, Validators.min(0)]],
      grade: [this.gradeSubmission.grade, [Validators.required]],
      status: [this.gradeSubmission.status || 'Draft', [Validators.required]],
      submissionDate: [this.gradeSubmission.submissionDate, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.gradeForm.valid) {
      const formData = this.gradeForm.getRawValue();
      if (this.action === 'edit') {
        this.gradeService.updateGradeSubmission(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.gradeService.addGradeSubmission(formData).subscribe({
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

  confirmAdd(): void {
    this.submit();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
