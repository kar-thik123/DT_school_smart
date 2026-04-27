import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LessonPlanService } from '../../lesson-plan.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { LessonPlan } from '../../lesson-plan.model';
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
  lessonPlan: LessonPlan;
}

@Component({
  selector: 'app-lesson-plan-form',
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
export class LessonPlanFormComponent {
  dialogRef = inject<MatDialogRef<LessonPlanFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  lessonService = inject(LessonPlanService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  lessonForm: UntypedFormGroup;
  lessonPlan: LessonPlan;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Lesson Plan: ${this.data.lessonPlan.topic}`;
      this.lessonPlan = this.data.lessonPlan;
    } else {
      this.dialogTitle = 'New Lesson Plan';
      this.lessonPlan = {} as LessonPlan;
    }
    this.lessonForm = this.createLessonForm();
  }

  createLessonForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.lessonPlan.id],
      class: [this.lessonPlan.class, [Validators.required]],
      subject: [this.lessonPlan.subject, [Validators.required]],
      topic: [this.lessonPlan.topic, [Validators.required]],
      date: [this.lessonPlan.date, [Validators.required]],
      status: [this.lessonPlan.status || 'Planned', [Validators.required]],
      lessonDetails: [this.lessonPlan.lessonDetails, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.lessonForm.valid) {
      const formData = this.lessonForm.getRawValue();
      formData.date = formatDate(this.lessonForm.value.date, 'yyyy-MM-dd', 'en-US');

      if (this.action === 'edit') {
        this.lessonService.updateLessonPlan(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.lessonService.addLessonPlan(formData).subscribe({
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
}
