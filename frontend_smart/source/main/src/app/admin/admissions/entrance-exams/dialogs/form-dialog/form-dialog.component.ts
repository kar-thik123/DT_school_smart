import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { EntranceExamService } from '../../entrance-exams.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { EntranceExam } from '../../entrance-exams.model';
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
  entranceExam: EntranceExam;
}

@Component({
  selector: 'app-entrance-exam-form',
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
export class EntranceExamFormComponent {
  dialogRef = inject<MatDialogRef<EntranceExamFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  entranceExamService = inject(EntranceExamService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  entranceExamForm: UntypedFormGroup;
  entranceExam: EntranceExam;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.entranceExam.exam_name
        : 'New Entrance Exam';
    this.entranceExam =
      this.action === 'edit'
        ? data.entranceExam
        : new EntranceExam({} as EntranceExam);
    this.entranceExamForm = this.createEntranceExamForm();
  }

  createEntranceExamForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.entranceExam.id],
      exam_name: [this.entranceExam.exam_name, [Validators.required]],
      exam_code: [this.entranceExam.exam_code, [Validators.required]],
      exam_date: [this.entranceExam.exam_date, [Validators.required]],
      start_time: [this.entranceExam.start_time, [Validators.required]],
      end_time: [this.entranceExam.end_time, [Validators.required]],
      venue: [this.entranceExam.venue, [Validators.required]],
      max_marks: [this.entranceExam.max_marks, [Validators.required]],
      passing_marks: [this.entranceExam.passing_marks, [Validators.required]],
      status: [this.entranceExam.status, [Validators.required]],
      description: [this.entranceExam.description],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.entranceExamForm.valid) {
      const formData = this.entranceExamForm.getRawValue();
      if (this.action === 'edit') {
        this.entranceExamService.updateEntranceExam(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.entranceExamService.addEntranceExam(formData).subscribe({
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
