import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { DailyAttendanceService } from '../../daily-attendance.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { DailyAttendance } from '../../daily-attendance.model';
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
  dailyAttendance: DailyAttendance;
}

@Component({
  selector: 'app-daily-attendance-form',
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
export class DailyAttendanceFormComponent {
  dialogRef = inject<MatDialogRef<DailyAttendanceFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  attendanceService = inject(DailyAttendanceService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  attendanceForm: UntypedFormGroup;
  dailyAttendance: DailyAttendance;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Attendance: ${this.data.dailyAttendance.studentName}`;
      this.dailyAttendance = this.data.dailyAttendance;
    } else {
      this.dialogTitle = 'Add Daily Attendance';
      this.dailyAttendance = {} as DailyAttendance;
    }
    this.attendanceForm = this.createAttendanceForm();
  }

  createAttendanceForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.dailyAttendance.id],
      rollNo: [this.dailyAttendance.rollNo, [Validators.required]],
      studentName: [this.dailyAttendance.studentName, [Validators.required]],
      class: [this.dailyAttendance.class, [Validators.required]],
      date: [this.dailyAttendance.date || new Date(), [Validators.required]],
      status: [this.dailyAttendance.status || 'Present', [Validators.required]],
      note: [this.dailyAttendance.note],
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
      formData.date = formatDate(this.attendanceForm.value.date, 'yyyy-MM-dd', 'en-US');

      if (this.action === 'edit') {
        this.attendanceService.updateDailyAttendance(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.attendanceService.addDailyAttendance(formData).subscribe({
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
