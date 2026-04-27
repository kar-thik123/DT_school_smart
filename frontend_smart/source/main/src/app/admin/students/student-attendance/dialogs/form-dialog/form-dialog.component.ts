import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StudentAttendanceService } from '../../student-attendance.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DATE_LOCALE,
  MatOptionModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { formatDate } from '@angular/common';
import { StudentAttendance } from '../../student-attendance.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTimepickerModule } from '@angular/material/timepicker';

export interface DialogData {
  id: number;
  action: string;
  studentAttendance: StudentAttendance;
}

@Component({
  selector: 'app-student-attendance-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
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
    MatTimepickerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAttendanceFormComponent {
  dialogRef = inject<MatDialogRef<StudentAttendanceFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentAttendanceService = inject(StudentAttendanceService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  studentAttendanceForm: UntypedFormGroup;
  studentAttendance: StudentAttendance;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.studentAttendance.sName : 'New Attendance';
    this.studentAttendance =
      this.action === 'edit'
        ? data.studentAttendance
        : new StudentAttendance({});

    // Initialize the form
    this.studentAttendanceForm = this.createAttendanceForm();
  }

  createAttendanceForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.studentAttendance.id],
      img: [this.studentAttendance.img],
      rollNo: [this.studentAttendance.rollNo, [Validators.required]],
      sName: [this.studentAttendance.sName, [Validators.required]],
      class: [this.studentAttendance.class, [Validators.required]],
      date: [
        formatDate(this.studentAttendance.date, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      status: [this.studentAttendance.status, [Validators.required]],
      note: [this.studentAttendance.note],
      semester: [this.studentAttendance.semester, [Validators.required]],
      subject: [this.studentAttendance.subject, [Validators.required]],
      attendance_time: [
        this.studentAttendance.attendance_time
          ? this.parseTimeString(this.studentAttendance.attendance_time)
          : null,
      ],
      present_count: [this.studentAttendance.present_count || 0],
      absent_count: [this.studentAttendance.absent_count || 0],
      reason_for_absence: [this.studentAttendance.reason_for_absence],
      approved: [this.studentAttendance.approved || false],
      timestamp: [this.studentAttendance.timestamp],
    });
  }

  // Display error messages for form controls
  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }
  private parseTimeString(timeString: string): Date | null {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0); // Set hours and minutes
    return date;
  }

  // Handle the form submission
  submit(): void {
    if (this.studentAttendanceForm.valid) {
      const formData = this.studentAttendanceForm.getRawValue();
      if (formData.attendance_time instanceof Date) {
        formData.attendance_time = this.formatTime(formData.attendance_time);
      }

      if (this.action === 'edit') {
        this.studentAttendanceService
          .updateStudentAttendance(formData)
          .subscribe({
            next: (response) => {
              this.dialogRef.close(response);
            },
            error: (error) => {
              console.error('Update Error:', error);
              // Handle error appropriately
            },
          });
      } else {
        this.studentAttendanceService.addStudentAttendance(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
            // Handle error appropriately
          },
        });
      }
    }
  }
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  // Close the dialog without saving
  onNoClick(): void {
    this.dialogRef.close();
  }
}
