import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Schedule } from '../../schedule.model';
import { ScheduleService } from '../../schedule.service';

export interface DialogData {
  id: number;
  action: string;
  schedule: Schedule;
}

@Component({
  selector: 'app-today-schedule-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogClose,
  ],
})
export class TodayScheduleFormComponent {
  private fb = inject(UntypedFormBuilder);
  public dialogRef = inject(MatDialogRef<TodayScheduleFormComponent>);
  private scheduleService = inject(ScheduleService); // Inject ScheduleService

  action: string;
  dialogTitle: string;
  scheduleForm: UntypedFormGroup; // Renamed from proForm to scheduleForm
  schedule: Schedule;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.action = data.action;
    this.schedule = data.schedule || {} as Schedule;
    this.dialogTitle = this.action === 'edit' ? `Edit Schedule: ${this.schedule.subject}` : 'New Schedule';
    this.scheduleForm = this.createContactForm(); // Use scheduleForm
  }

  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.schedule.id],
      subject: [this.schedule.subject, [Validators.required]],
      class: [this.schedule.class, [Validators.required]],
      time: [this.schedule.time, [Validators.required]],
      duration: [this.schedule.duration, [Validators.required]],
      room: [this.schedule.room, [Validators.required]],
      status: [this.schedule.status || 'Upcoming', [Validators.required]],
    });
  }

  submit(): void {
    if (this.scheduleForm.valid) {
      if (this.action === 'edit') {
        this.scheduleService.updateSchedule(this.scheduleForm.getRawValue()).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.scheduleService.addSchedule(this.scheduleForm.getRawValue()).subscribe({
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

  public confirmAdd(): void {
    this.submit();
  }
}

