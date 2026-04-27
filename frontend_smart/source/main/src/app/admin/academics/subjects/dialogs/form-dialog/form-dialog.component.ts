import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SubjectsService } from '../../subjects.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subjects } from '../../subjects.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  subjects: Subjects;
}

@Component({
  selector: 'app-subjects-form',
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
export class SubjectsFormComponent {
  dialogRef = inject<MatDialogRef<SubjectsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  subjectsService = inject(SubjectsService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  subjectsForm: UntypedFormGroup;
  subjects: Subjects;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.subjects.subjectName
        : 'New Subject';
    this.subjects =
      this.action === 'edit'
        ? data.subjects
        : new Subjects({} as Subjects);

    this.subjectsForm = this.createSubjectsForm();
  }

  createSubjectsForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.subjects.id],
      subjectName: [this.subjects.subjectName, [Validators.required]],
      subjectCode: [this.subjects.subjectCode, [Validators.required]],
      subjectType: [this.subjects.subjectType, [Validators.required]],
      status: [this.subjects.status, [Validators.required]],
      prerequisites: [this.subjects.prerequisites],
      credits: [this.subjects.credits],
    });
  }

  getErrorMessage(control: any): string {
    if (control && control.hasError && control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.subjectsForm.valid) {
      const formData = this.subjectsForm.getRawValue();
      if (this.action === 'edit') {
        this.subjectsService.updateSubject(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.subjectsService.addSubject(formData).subscribe({
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
