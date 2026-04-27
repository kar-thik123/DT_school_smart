import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { Calendar } from '../../calendar.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatOptionModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { CalendarService } from '../../calendar.service';

export interface DialogData {
  id: number;
  action: string;
  calendar: Calendar;
}

@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [provideNativeDateAdapter()],
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
    MatDialogClose,
    MatTimepickerModule,
    MatDatepickerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDialogComponent {
  dialogRef = inject<MatDialogRef<FormDialogComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  calendarService = inject(CalendarService);

  action: string;
  dialogTitle: string;
  calendar: Calendar;
  showDeleteBtn: boolean;
  eventStartDateTime?: Date;
  eventEndDateTime?: Date;

  constructor() {
    const data = this.data;

    // Set action and dialog title
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.calendar.title : 'New Event';

    // Set the calendar object (either from existing data or a blank one)
    this.calendar =
      this.action === 'edit' ? data.calendar : new Calendar({} as Calendar);

    // Set startValue and endValue as Date objects from the calendar data
    if (this.calendar.startDate) {
      this.eventStartDateTime = new Date(this.calendar.startDate);
    }
    if (this.calendar.endDate) {
      this.eventEndDateTime = new Date(this.calendar.endDate);
    }
    // Determine if the delete button should be shown
    this.showDeleteBtn = this.action === 'edit';
  }

  submit() {
    if (this.eventStartDateTime) {
      this.calendar.startDate = this.eventStartDateTime.toISOString();
    }
    if (this.eventEndDateTime) {
      this.calendar.endDate = this.eventEndDateTime.toISOString();
    }

    if (
      this.calendar.title &&
      this.calendar.startDate &&
      this.calendar.endDate
    ) {
      if (this.action === 'edit') {
        // Update existing calendar event
        this.calendarService.updateCalendar(this.calendar).subscribe({
          next: (response) => {
            const updatedResponse = {
              data: response,
              action: 'edit',
            };
            this.dialogRef.close(updatedResponse);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        // Add new calendar event
        this.calendarService.addCalendar(this.calendar).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and return newly added calendar data
          },
          error: (error) => {
            console.error('Add Error:', error);
          },
        });
      }
    }
  }

  deleteEvent() {
    if (this.calendar) {
      this.calendarService.deleteCalendar(this.calendar).subscribe({
        next: (response) => {
          const updatedResponse = {
            data: response,
            action: 'delete',
          };
          // Close dialog and pass the updated response
          this.dialogRef.close(updatedResponse);
        },
        error: (error) => {
          console.error('Delete Error:', error);
        },
      });
    }
  }

  onNoClick(): void {
    this.dialogRef.close(); // Close dialog without any action
  }
}
