import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentDisciplineService } from '../../student-discipline.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { StudentDiscipline } from '../../student-discipline.model';
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
  studentDiscipline: StudentDiscipline;
}

@Component({
    selector: 'app-student-discipline-form',
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
export class StudentDisciplineFormComponent {
  dialogRef = inject<MatDialogRef<StudentDisciplineFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentDisciplineService = inject(StudentDisciplineService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  studentDisciplineForm: UntypedFormGroup;
  studentDiscipline: StudentDiscipline;

  constructor() {
    const data = this.data;

    // Set action and student discipline data
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.studentDiscipline.student_name
        : 'New Discipline Record';
    this.studentDiscipline =
      this.action === 'edit'
        ? data.studentDiscipline
        : new StudentDiscipline({} as StudentDiscipline);

    // Create form
    this.studentDisciplineForm = this.createStudentDisciplineForm();
  }

  // Create form group for student discipline fields with validation
  createStudentDisciplineForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.studentDiscipline.id],
      img: [this.studentDiscipline.img],
      student_name: [this.studentDiscipline.student_name, [Validators.required]],
      incident_date: [this.studentDiscipline.incident_date, [Validators.required]],
      incident_type: [this.studentDiscipline.incident_type, [Validators.required]],
      incident_location: [this.studentDiscipline.incident_location, [Validators.required]],
      reported_by: [this.studentDiscipline.reported_by, [Validators.required]],
      action_taken: [this.studentDiscipline.action_taken, [Validators.required]],
      action_date: [this.studentDiscipline.action_date],
      description: [this.studentDiscipline.description],
      severity: [this.studentDiscipline.severity, [Validators.required]],
      status: [this.studentDiscipline.status, [Validators.required]],
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
    if (this.studentDisciplineForm.valid) {
      const formData = this.studentDisciplineForm.getRawValue();
      if (this.action === 'edit') {
        this.studentDisciplineService.updateStudentDiscipline(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.studentDisciplineService.addStudentDiscipline(formData).subscribe({
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

  // Confirm and add the student discipline
  public confirmAdd(): void {
    this.submit();
  }
}
