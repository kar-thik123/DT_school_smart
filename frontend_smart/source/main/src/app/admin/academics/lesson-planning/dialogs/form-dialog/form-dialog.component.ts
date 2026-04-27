import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LessonPlanningService } from '../../lesson-planning.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { LessonPlanning } from '../../lesson-planning.model';
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
  lessonPlanning: LessonPlanning;
}

@Component({
  selector: 'app-lesson-planning-form',
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
    MatDialogClose,
    MatDatepickerModule,
  ],
})
export class LessonPlanningFormComponent {
  dialogRef = inject<MatDialogRef<LessonPlanningFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  lessonPlanningService = inject(LessonPlanningService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  lessonPlanningForm: UntypedFormGroup;
  lessonPlanning: LessonPlanning;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.lessonPlanning.lessonName
        : 'New Lesson Plan';
    this.lessonPlanning =
      this.action === 'edit'
        ? data.lessonPlanning
        : new LessonPlanning({} as LessonPlanning);

    this.lessonPlanningForm = this.createLessonPlanningForm();
  }

  createLessonPlanningForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.lessonPlanning.id],
      topicName: [this.lessonPlanning.topicName, [Validators.required]],
      lessonName: [this.lessonPlanning.lessonName, [Validators.required]],
      className: [this.lessonPlanning.className, [Validators.required]],
      subjectName: [this.lessonPlanning.subjectName, [Validators.required]],
      teacherName: [this.lessonPlanning.teacherName, [Validators.required]],
      lessonDate: [this.lessonPlanning.lessonDate, [Validators.required]],
      status: [this.lessonPlanning.status, [Validators.required]],
      objectives: [this.lessonPlanning.objectives],
      teachingMethod: [this.lessonPlanning.teachingMethod],
    });
  }

  getErrorMessage(control: any): string {
    if (control && control.hasError && control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.lessonPlanningForm.valid) {
      const formData = this.lessonPlanningForm.getRawValue();
      if (this.action === 'edit') {
        this.lessonPlanningService.updateLesson(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.lessonPlanningService.addLesson(formData).subscribe({
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
