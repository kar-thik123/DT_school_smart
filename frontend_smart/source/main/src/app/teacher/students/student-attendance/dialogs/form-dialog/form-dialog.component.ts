import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentAttendanceService } from '../../student-attendance.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { StudentAttendance } from '../../student-attendance.model';
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
  attendance: StudentAttendance;
}

@Component({
  selector: 'app-student-attendance-form',
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
    MatDatepickerModule,
    MatDialogClose,
  ],
})
export class StudentAttendanceFormComponent {
  dialogRef = inject<MatDialogRef<StudentAttendanceFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  attendanceService = inject(StudentAttendanceService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  attendanceForm: UntypedFormGroup;
  attendance: StudentAttendance;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Attendance: ${this.data.attendance.name}`;
      this.attendance = this.data.attendance;
    } else {
      this.dialogTitle = 'New Attendance Record';
      this.attendance = {} as StudentAttendance;
    }
    this.attendanceForm = this.createAttendanceForm();
  }

  createAttendanceForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.attendance.id],
      rollNo: [this.attendance.rollNo, [Validators.required]],
      name: [this.attendance.name, [Validators.required]],
      date: [this.attendance.date, [Validators.required]],
      status: [this.attendance.status || 'Present', [Validators.required]],
      remarks: [this.attendance.remarks],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.attendanceForm.valid) {
      const formData = this.attendanceForm.getRawValue();
      if (this.action === 'edit') {
        this.attendanceService.updateAttendance(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.attendanceService.addAttendance(formData).subscribe({
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
