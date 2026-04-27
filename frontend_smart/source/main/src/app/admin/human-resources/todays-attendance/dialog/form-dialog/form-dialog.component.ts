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
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { TodaysAttendance } from '../../todays-attendance..model';
import { TodaysAttendanceService } from '../../todays-attendance.service';

export interface DialogData {
  id: number;
  action: string;
  todaysAttendance: TodaysAttendance;
}

@Component({
  selector: 'app-todays-attendance-form',
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
  ],
})
export class TodayFormComponent {
  dialogRef = inject<MatDialogRef<TodayFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  todaysAttendanceService = inject(TodaysAttendanceService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  todayForm: UntypedFormGroup;
  todaysAttendance: TodaysAttendance;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.todaysAttendance =
      this.action === 'edit'
        ? data.todaysAttendance
        : new TodaysAttendance({} as TodaysAttendance);
    this.dialogTitle =
      this.action === 'edit' ? `${this.todaysAttendance.name}` : 'New Entry'; // Updated title for clarity
    this.todayForm = this.createTodayForm();
  }

  private createTodayForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.todaysAttendance.id],
      img: [this.todaysAttendance.img],
      name: [this.todaysAttendance.name, [Validators.required]],
      first_in: [this.todaysAttendance.first_in, [Validators.required]],
      break: [this.todaysAttendance.break, [Validators.required]],
      last_out: [this.todaysAttendance.last_out, [Validators.required]],
      total: [this.todaysAttendance.total],
      status: [this.todaysAttendance.status, [Validators.required]],
      shift: [this.todaysAttendance.shift, [Validators.required]],
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.todayForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Required field';
    }
    // Add other validations if necessary
    return '';
  }

  submit(): void {
    if (this.todayForm.valid) {
      const todayData = this.todayForm.getRawValue();
      if (this.action === 'edit') {
        this.todaysAttendanceService.updateToday(todayData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Optionally show an error message to the user
          },
        });
      } else {
        this.todaysAttendanceService.addToday(todayData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
            // Optionally show an error message to the user
          },
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
