import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { HolidayService } from '../../all-holidays.service';
import {
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AllHoliday } from '../../all-holidays.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  allHoliday: AllHoliday;
}

@Component({
    selector: 'app-all-holidays-form',
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
export class AllHolidaysFormComponent {
  dialogRef = inject<MatDialogRef<AllHolidaysFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  holidayService = inject(HolidayService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  holidayForm: UntypedFormGroup;
  allHoliday: AllHoliday;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.allHoliday =
      this.action === 'edit'
        ? data.allHoliday
        : new AllHoliday({} as AllHoliday);
    this.dialogTitle =
      this.action === 'edit' ? this.allHoliday.holidayName : 'New Holiday';
    this.holidayForm = this.createHolidayForm();
  }

  private createHolidayForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.allHoliday.id],
      holidayName: [this.allHoliday.holidayName, [Validators.required]],
      date: [this.allHoliday.date, [Validators.required]],
      location: [this.allHoliday.location],
      shift: [this.allHoliday.shift],
      details: [this.allHoliday.details],
      holidayType: [this.allHoliday.holidayType],
      createdBy: [this.allHoliday.createdBy],
      creationDate: [this.allHoliday.creationDate],
      approvalStatus: [this.allHoliday.approvalStatus],
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.holidayForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Required field';
    }
    return '';
  }

  submit(): void {
    if (this.holidayForm.valid) {
      const holidayData = this.holidayForm.getRawValue();
      if (this.action === 'edit') {
        this.holidayService.updateHoliday(holidayData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Optionally show an error message to the user
          },
        });
      } else {
        this.holidayService.addHoliday(holidayData).subscribe({
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
