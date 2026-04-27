import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { CourseCurriculumService } from '../../course-curriculum.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CourseCurriculum } from '../../course-curriculum.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  courseCurriculum: CourseCurriculum;
}

@Component({
  selector: 'app-course-curriculum-form',
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
  ],
})
export class CourseCurriculumFormComponent {
  dialogRef = inject<MatDialogRef<CourseCurriculumFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  courseCurriculumService = inject(CourseCurriculumService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  curriculumForm: UntypedFormGroup;
  courseCurriculum: CourseCurriculum;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.courseCurriculum.courseName
        : 'New Curriculum';
    this.courseCurriculum =
      this.action === 'edit'
        ? data.courseCurriculum
        : new CourseCurriculum({} as CourseCurriculum);

    this.curriculumForm = this.createCurriculumForm();
  }

  createCurriculumForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.courseCurriculum.id],
      courseName: [this.courseCurriculum.courseName, [Validators.required]],
      className: [this.courseCurriculum.className, [Validators.required]],
      subjectName: [this.courseCurriculum.subjectName, [Validators.required]],
      description: [this.courseCurriculum.description],
      status: [this.courseCurriculum.status, [Validators.required]],
      duration: [this.courseCurriculum.duration, [Validators.required]],
      referenceMaterial: [this.courseCurriculum.referenceMaterial],
    });
  }

  getErrorMessage(control: any): string {
    if (control && control.hasError && control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.curriculumForm.valid) {
      const formData = this.curriculumForm.getRawValue();
      if (this.action === 'edit') {
        this.courseCurriculumService.updateCurriculum(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.courseCurriculumService.addCurriculum(formData).subscribe({
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
