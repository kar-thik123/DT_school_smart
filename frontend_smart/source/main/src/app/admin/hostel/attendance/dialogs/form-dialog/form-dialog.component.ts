import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AttendanceService } from '../../attendance.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Attendance } from '../../attendance.model';
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
  attendance: Attendance;
}

@Component({
  selector: 'app-attendance-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  standalone: true,
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
    MatDatepickerModule,
  ],
})
export class AttendanceFormComponent {
  dialogRef = inject<MatDialogRef<AttendanceFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  attendanceService = inject(AttendanceService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  attendanceForm: UntypedFormGroup;
  attendance: Attendance;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.attendance.student_name
        : 'New Attendance';
    this.attendance =
      this.action === 'edit'
        ? data.attendance
        : new Attendance({} as Attendance);

    this.attendanceForm = this.createAttendanceForm();
  }

  createAttendanceForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.attendance.id],
      img: [this.attendance.img],
      student_name: [this.attendance.student_name, [Validators.required]],
      roll_no: [this.attendance.roll_no, [Validators.required]],
      hostel_name: [this.attendance.hostel_name, [Validators.required]],
      room_no: [this.attendance.room_no, [Validators.required]],
      attendance_date: [this.attendance.attendance_date, [Validators.required]],
      status: [this.attendance.status, [Validators.required]],
      note: [this.attendance.note],
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

  onNoClick(): void {
    this.dialogRef.close();
  }
}
