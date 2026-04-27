import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { DepartmentService } from '../../department.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Department } from '../../department.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  department: Department;
}

@Component({
    selector: 'app-departments-form',
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
        MatDialogClose,
    ]
})
export class DepartmentsFormComponent {
  dialogRef = inject<MatDialogRef<DepartmentsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  departmentService = inject(DepartmentService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  departmentForm: UntypedFormGroup;
  department: Department;

  constructor() {
    const data = this.data;

    // Set action and department data
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.department.department_name
        : 'New Department';
    this.department =
      this.action === 'edit'
        ? data.department
        : new Department({} as Department);

    // Create form
    this.departmentForm = this.createDepartmentForm();
  }

  // Create form group for department fields with validation
  createDepartmentForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.department.id],
      img: [this.department.img],
      department_name: [this.department.department_name, [Validators.required]],
      hod: [this.department.hod, [Validators.required]],
      phone: [this.department.phone, [Validators.required]],
      email: [
        this.department.email,
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      student_capacity: [
        this.department.student_capacity,
        [Validators.required],
      ],
      establishedYear: [this.department.establishedYear, [Validators.required]],
      totalFaculty: [this.department.totalFaculty, [Validators.required]],
    });
  }

  // Handle form validation errors for user feedback
  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('email')) {
      return 'Invalid email format';
    }
    return '';
  }

  // Submit form data
  submit(): void {
    if (this.departmentForm.valid) {
      const formData = this.departmentForm.getRawValue();
      if (this.action === 'edit') {
        this.departmentService.updateDepartment(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.departmentService.addDepartment(formData).subscribe({
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

  // Confirm and add the department
  public confirmAdd(): void {
    this.submit();
  }
}
