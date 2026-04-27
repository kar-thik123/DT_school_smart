import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { ClassStudentService } from '../../class-student.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ClassStudent } from '../../class-student.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  student: ClassStudent;
}

@Component({
  selector: 'app-class-student-form',
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
export class ClassStudentFormComponent {
  dialogRef = inject<MatDialogRef<ClassStudentFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentService = inject(ClassStudentService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  studentForm: UntypedFormGroup;
  student: ClassStudent;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Student: ${this.data.student.name}`;
      this.student = this.data.student;
    } else {
      this.dialogTitle = 'New Student';
      this.student = {} as ClassStudent;
    }
    this.studentForm = this.createStudentForm();
  }

  createStudentForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.student.id],
      rollNo: [this.student.rollNo, [Validators.required]],
      name: [this.student.name, [Validators.required]],
      gender: [this.student.gender || 'Male', [Validators.required]],
      parentName: [this.student.parentName, [Validators.required]],
      mobile: [this.student.mobile, [Validators.required]],
      email: [this.student.email, [Validators.required, Validators.email]],
      address: [this.student.address, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('email')) {
      return 'Invalid email format';
    }
    return '';
  }

  submit(): void {
    if (this.studentForm.valid) {
      const formData = this.studentForm.getRawValue();
      if (this.action === 'edit') {
        this.studentService.updateStudent(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.studentService.addStudent(formData).subscribe({
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
