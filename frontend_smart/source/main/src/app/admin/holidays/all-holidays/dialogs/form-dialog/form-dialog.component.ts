import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { HolidayService } from '../../holiday.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Holiday } from '../../holiday.model';
import { MAT_DATE_LOCALE } from '@angular/material/core';
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
  holiday: Holiday;
}

@Component({
    selector: 'app-all-holidays-form',
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
        MatInputModule,
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
  holiday: Holiday;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.holiday.title : 'New Holiday';
    this.holiday = this.action === 'edit' ? data.holiday : new Holiday({});

    // Create the holiday form
    this.holidayForm = this.createHolidayForm();
  }

  // Create holiday form with validators
  createHolidayForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.holiday.id],
      title: [this.holiday.title, [Validators.required]],
      start_date: [
        formatDate(this.holiday.start_date, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      end_date: [
        formatDate(this.holiday.end_date, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      type: [this.holiday.type, [Validators.required]],
      description: [this.holiday.description],
      location: [this.holiday.location || 'Global'],
      created_at: [this.holiday.created_at],
      updated_at: [this.holiday.updated_at],
      is_recurring: [this.holiday.is_recurring],
      status: [this.holiday.status || 'Active'],
    });
  }

  // Handle error messages for form fields
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data
  submit(): void {
    if (this.holidayForm.valid) {
      const formData = this.holidayForm.getRawValue();
      if (this.action === 'edit') {
        this.holidayService.updateHoliday(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.holidayService.addHoliday(formData).subscribe({
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

  // Confirm and add or update holiday
  public confirmAdd(): void {
    this.submit();
  }
}
