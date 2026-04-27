import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentsService } from '../../students.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Students } from '../../students.model';
import { formatDate } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  student: Students;
}

@Component({
    selector: 'app-students-form',
    templateUrl: './form-dialog.component.html',
    styleUrls: ['./form-dialog.component.scss'],
    imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatDatepickerModule,
        MatDialogClose,
    ]
})
export class StudentsFormComponent {
  dialogRef = inject<MatDialogRef<StudentsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentsService = inject(StudentsService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  stdForm: UntypedFormGroup;
  student: Students;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.student.name : 'New Student';
    this.student = this.action === 'edit' ? data.student : new Students({});
    this.stdForm = this.createStudentForm();
  }

  createStudentForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.student.id],
      img: [this.student.img],
      name: [this.student.name, [Validators.required]],
      email: [
        this.student.email,
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      gender: [this.student.gender],
      mobile: [this.student.mobile, [Validators.required]],
      department: [this.student.department, [Validators.required]],
      rollNo: [this.student.rollNo, [Validators.required]],
      date_of_birth: [
        formatDate(this.student.date_of_birth, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      address: [this.student.address],
      enrollment_date: [
        formatDate(this.student.enrollment_date, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      graduation_year: [this.student.graduation_year],
      parent_guardian_name: [this.student.parent_guardian_name],
      parent_guardian_mobile: [
        this.student.parent_guardian_mobile,
        [Validators.required],
      ],
      status: [this.student.status],
      profile_completion_status: [this.student.profile_completion_status],
      scholarship_status: [this.student.scholarship_status],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    } else if (control.hasError('email')) {
      return 'Please enter a valid email';
    } else if (control.hasError('pattern')) {
      return 'Invalid mobile number';
    }
    return '';
  }

  submit() {
    if (this.stdForm.valid) {
      const formData = this.stdForm.getRawValue();
      if (this.action === 'edit') {
        this.studentsService.updateStudent(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Optionally display an error message to the user
          },
        });
      } else {
        this.studentsService.addStudent(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
            // Optionally display an error message to the user
          },
        });
      }
    }
  }

  onNoClick(): void {
    this.stdForm.reset(); // Reset the form
    this.dialogRef.close();
  }
}
