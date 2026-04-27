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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Homework } from '../homework.model';
import { HomeworkService } from '../homework.service';

export interface DialogData {
  id: number;
  action: string;
  homework: Homework;
}

@Component({
  selector: 'app-homework-form',
  standalone: true,
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
    MatCardModule,
    DatePipe,
  ],
})
export class HomeworkFormComponent {
  dialogRef = inject<MatDialogRef<HomeworkFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  homeworkService = inject(HomeworkService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle?: string;
  homeworkForm?: UntypedFormGroup;
  homework: Homework;
  isDetails = false;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    if (this.action === 'details') {
      this.homework = data.homework;
      this.isDetails = true;
    } else {
      this.isDetails = false;
      this.dialogTitle = 'New Leave Request';
      const blankObject = {} as Homework;
      this.homework = new Homework(blankObject);
      this.homeworkForm = this.createHomeworksForm();
    }
  }

  // Create the homework form with required validators
  createHomeworksForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.homework.id],
      class: [this.homework.class, [Validators.required]],
      section: [this.homework.section, [Validators.required]],
      subject: [this.homework.subject, [Validators.required]],
      homeworkTitle: [this.homework.homeworkTitle, [Validators.required]],
      assignedBy: [this.homework.assignedBy, [Validators.required]],
      homeworkDate: [this.homework.homeworkDate, [Validators.required]],
      submissionDate: [this.homework.submissionDate, [Validators.required]],
      evaluationDate: [this.homework.evaluationDate],
      status: [this.homework.status, [Validators.required]],
      grade: [this.homework.grade],
      feedback: [this.homework.feedback],
      attachments: [this.homework.attachments],
      lateSubmission: [this.homework.lateSubmission, [Validators.required]],
    });
  }

  // Handle error messages for form controls
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data, handle edit or add based on action type
  submit(): void {
    if (this.homeworkForm?.valid) {
      const formData = this.homeworkForm?.getRawValue();
      if (this.action === 'edit') {
        this.homeworkService.updateHomework(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog with response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.homeworkService.addHomework(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog with response
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
