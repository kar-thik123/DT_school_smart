import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { TeachersService } from '../../teachers.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Teachers } from '../../teachers.model';
import { formatDate } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  teachers: Teachers;
}

@Component({
    selector: 'app-teachers-form',
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
        MatRadioModule,
        MatDatepickerModule,
        MatSelectModule,
        MatDialogClose,
    ]
})
export class TeachersFormComponent {
  dialogRef = inject<MatDialogRef<TeachersFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  teachersService = inject(TeachersService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  teacherForm: UntypedFormGroup;
  teachers: Teachers;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.teachers.name : 'New Teacher';
    this.teachers = this.action === 'edit' ? data.teachers : new Teachers({});
    this.teacherForm = this.createTeacherForm();
  }

  createTeacherForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.teachers.id],
      img: [this.teachers.img],
      name: [this.teachers.name],
      email: [
        this.teachers.email,
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      hire_date: [
        formatDate(this.teachers.hire_date, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      gender: [this.teachers.gender],
      mobile: [this.teachers.mobile],
      department: [this.teachers.department],
      degree: [this.teachers.degree],
      address: [this.teachers.address],
      salary: [this.teachers.salary, [Validators.required, Validators.min(0)]], // Added validation for salary
      subject_specialization: [this.teachers.subject_specialization],
      experience_years: [
        this.teachers.experience_years,
        [Validators.required, Validators.min(0)],
      ], // Added validation for experience
      status: [this.teachers.status],
      birthdate: [this.teachers.birthdate, [Validators.required]], // Added validation for birthdate
      bio: [this.teachers.bio],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    } else if (control.hasError('email')) {
      return 'Please enter a valid email';
    }
    return '';
  }

  submit() {
    if (this.teacherForm.valid) {
      const formData = this.teacherForm.getRawValue();
      if (this.action === 'edit') {
        this.teachersService.updateTeacher(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Optionally display an error message to the user
          },
        });
      } else {
        this.teachersService.addTeacher(formData).subscribe({
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
    this.teacherForm.reset(); // Reset the form
    this.dialogRef.close();
  }
}
