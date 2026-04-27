import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { ExamScheduleService } from '../../exam-schedule.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExamSchedule } from '../../exam-schedule.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  examSchedule: ExamSchedule;
}

@Component({
  selector: 'app-form-dialog',
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
    MatDialogClose,
    MatSelectModule,
    MatDatepickerModule,
  ],
})
export class FormDialogComponent {
  action: string;
  dialogTitle: string;
  examScheduleForm: UntypedFormGroup;
  examSchedule: ExamSchedule;

  private examScheduleService = inject(ExamScheduleService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Schedule: ${data.examSchedule.subject}`;
      this.examSchedule = data.examSchedule;
    } else {
      this.dialogTitle = 'New Exam Schedule';
      this.examSchedule = new ExamSchedule({} as ExamSchedule);
    }
    this.examScheduleForm = this.createExamScheduleForm();
  }

  createExamScheduleForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.examSchedule.id],
      exam_type: [this.examSchedule.exam_type, [Validators.required]],
      course: [this.examSchedule.course, [Validators.required]],
      semester: [this.examSchedule.semester, [Validators.required]],
      subject: [this.examSchedule.subject, [Validators.required]],
      exam_date: [this.examSchedule.exam_date, [Validators.required]],
      start_time: [this.examSchedule.start_time, [Validators.required]],
      end_time: [this.examSchedule.end_time, [Validators.required]],
      room_no: [this.examSchedule.room_no, [Validators.required]],
    });
  }

  submit() {
    if (this.examScheduleForm.valid) {
      const examScheduleData = this.examScheduleForm.getRawValue();
      if (this.action === 'edit') {
        this.examScheduleService.updateExamSchedule(examScheduleData).subscribe(() => {
          this.dialogRef.close(examScheduleData);
        });
      } else {
        this.examScheduleService.addExamSchedule(examScheduleData).subscribe(() => {
          this.dialogRef.close(examScheduleData);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
