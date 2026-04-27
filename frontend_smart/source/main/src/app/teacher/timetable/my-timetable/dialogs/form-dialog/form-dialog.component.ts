import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { TimetableService } from '../../timetable.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TimetableEntry } from '../../timetable.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  timetable: TimetableEntry;
}

@Component({
  selector: 'app-my-timetable-form',
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
    MatDialogClose,
  ],
})
export class MyTimetableFormComponent {
  dialogRef = inject<MatDialogRef<MyTimetableFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  timetableService = inject(TimetableService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  timetableForm: UntypedFormGroup;
  timetable: TimetableEntry;

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Timetable: ${this.data.timetable.subject}`;
      this.timetable = this.data.timetable;
    } else {
      this.dialogTitle = 'New Timetable Entry';
      this.timetable = {} as TimetableEntry;
    }
    this.timetableForm = this.createTimetableForm();
  }

  createTimetableForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.timetable.id],
      day: [this.timetable.day, [Validators.required]],
      timeSlot: [this.timetable.timeSlot, [Validators.required]],
      subject: [this.timetable.subject, [Validators.required]],
      class: [this.timetable.class, [Validators.required]],
      room: [this.timetable.room, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.timetableForm.valid) {
      const formData = this.timetableForm.getRawValue();
      if (this.action === 'edit') {
        this.timetableService.updateTimetable(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.timetableService.addTimetable(formData).subscribe({
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
