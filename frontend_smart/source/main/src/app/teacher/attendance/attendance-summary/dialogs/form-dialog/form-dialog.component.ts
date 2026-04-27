import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AttendanceSummaryService } from '../../attendance-summary.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { AttendanceSummary } from '../../attendance-summary.model';

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
  attendanceSummary: AttendanceSummary;
}

@Component({
  selector: 'app-attendance-summary-form',
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
export class AttendanceSummaryFormComponent {
  dialogRef = inject<MatDialogRef<AttendanceSummaryFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  summaryService = inject(AttendanceSummaryService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  attendanceForm: UntypedFormGroup;
  attendanceSummary: AttendanceSummary;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Attendance: ${this.data.attendanceSummary.class}`;
      this.attendanceSummary = this.data.attendanceSummary;
    } else {
      this.dialogTitle = 'New Attendance Summary';
      this.attendanceSummary = {} as AttendanceSummary;
    }
    this.attendanceForm = this.createAttendanceForm();
  }

  createAttendanceForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.attendanceSummary.id],
      class: [this.attendanceSummary.class, [Validators.required]],
      subject: [this.attendanceSummary.subject, [Validators.required]],
      totalStudents: [this.attendanceSummary.totalStudents, [Validators.required]],
      present: [this.attendanceSummary.present, [Validators.required]],
      absent: [this.attendanceSummary.absent, [Validators.required]],
      onLeave: [this.attendanceSummary.onLeave, [Validators.required]],
      attendancePercentage: [this.attendanceSummary.attendancePercentage],
      date: [this.attendanceSummary.date, [Validators.required]],
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
        this.summaryService.updateSummary(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.summaryService.addSummary(formData).subscribe({
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
