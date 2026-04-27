import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StaffService } from '../../staff.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Staff } from '../../staff.model';
import { formatDate } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  staff: Staff;
}

@Component({
    selector: 'app-all-staff-form',
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
        MatDatepickerModule,
        MatDialogClose,
    ]
})
export class AllStaffFormComponent {
  dialogRef = inject<MatDialogRef<AllStaffFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  staffService = inject(StaffService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  staffForm: UntypedFormGroup;
  staff: Staff;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.dialogTitle = this.action === 'edit' ? data.staff.name : 'New Staff';
    this.staff = this.action === 'edit' ? data.staff : new Staff({});

    // Create the staff form
    this.staffForm = this.createStaffForm();
  }

  // Create form group with validators
  createStaffForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.staff.id],
      img: [this.staff.img],
      name: [this.staff.name, [Validators.required]],
      email: [
        this.staff.email,
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      department: [this.staff.department, [Validators.required]],
      status: [this.staff.status, [Validators.required]],
      joining_date: [
        formatDate(this.staff.joining_date, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      salary: [this.staff.salary],
      experience: [this.staff.experience],
      role: [this.staff.role],
      date_of_birth: [
        formatDate(this.staff.date_of_birth, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      gender: [this.staff.gender, [Validators.required]],
      address: [this.staff.address],
      mobile: [this.staff.mobile, [Validators.required]],
    });
  }

  // Handle error messages for form fields
  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'Required field';
    }
    if (control.hasError('email')) {
      return 'Not a valid email';
    }
    return '';
  }

  // Submit form data
  submit(): void {
    if (this.staffForm.valid) {
      const formData = this.staffForm.getRawValue();
      if (this.action === 'edit') {
        this.staffService.updateStaff(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.staffService.addStaff(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
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

  // Confirm and add or update staff
  public confirmAdd(): void {
    this.submit();
  }
}
