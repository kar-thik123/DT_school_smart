import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import {
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StaffAttendance } from '../../staff-attendance.model';
import { StaffAttendanceService } from '../../staff-attendance.service';

export interface DialogData {
  id: number;
  action: string;
  staffAttendance: StaffAttendance;
}

@Component({
    selector: 'app-staff-attendance-form',
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
export class StaffAttendanceFormComponent {
  dialogRef = inject<MatDialogRef<StaffAttendanceFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  staffAttendanceService = inject(StaffAttendanceService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  staffForm: UntypedFormGroup;
  staffAttendance: StaffAttendance;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.staffAttendance.name : 'New Student';
    this.staffAttendance =
      this.action === 'edit' ? data.staffAttendance : new StaffAttendance({});
    this.staffForm = this.createStudentForm();
  }

  createStudentForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.staffAttendance.id],
      img: [this.staffAttendance.img],
      name: [this.staffAttendance.name, [Validators.required]],
      employee_id: [this.staffAttendance.employee_id, [Validators.required]],
      designation: [this.staffAttendance.designation, [Validators.required]],
      date: [this.staffAttendance.date, [Validators.required]],
      check_in: [this.staffAttendance.check_in, [Validators.required]],
      break: [this.staffAttendance.break, [Validators.required]],
      check_out: [this.staffAttendance.check_out, [Validators.required]],
      total: [this.staffAttendance.total, [Validators.required]],
      shift: [this.staffAttendance.shift],
      late_arrival: [this.staffAttendance.late_arrival],
      early_departure: [this.staffAttendance.early_departure],
      absence_reason: [this.staffAttendance.absence_reason],
      overtime: [this.staffAttendance.overtime],
      total_breaks: [this.staffAttendance.total_breaks],
      remarks: [this.staffAttendance.remarks],
      attendance_status: [
        this.staffAttendance.attendance_status,
        [Validators.required],
      ],
      department: [this.staffAttendance.department, [Validators.required]], // Kept department
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
    if (this.staffForm.valid) {
      const formData = this.staffForm.getRawValue();
      if (this.action === 'edit') {
        this.staffAttendanceService.updateStaffAttendance(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Optionally display an error message to the user
          },
        });
      } else {
        this.staffAttendanceService.addStaffAttendance(formData).subscribe({
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
    this.staffForm.reset(); // Reset the form
    this.dialogRef.close();
  }
}
