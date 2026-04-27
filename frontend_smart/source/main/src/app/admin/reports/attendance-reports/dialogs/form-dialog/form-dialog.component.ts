import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AttendanceReportService } from '../../attendance-report.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AttendanceReport } from '../../attendance-report.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  attendanceReport: AttendanceReport;
}

@Component({
  selector: 'app-attendance-report-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [MatButtonModule, MatIconModule, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatInputModule, MatDialogClose],
})
export class AttendanceReportFormComponent {
  dialogRef = inject<MatDialogRef<AttendanceReportFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  attendanceReportService = inject(AttendanceReportService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  attendanceReportForm: UntypedFormGroup;
  attendanceReport: AttendanceReport;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle = this.action === 'edit' ? data.attendanceReport.reportType : 'New Attendance Report';
    this.attendanceReport = this.action === 'edit' ? data.attendanceReport : new AttendanceReport({} as AttendanceReport);
    this.attendanceReportForm = this.createAttendanceReportForm();
  }

  createAttendanceReportForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.attendanceReport.id],
      img: [this.attendanceReport.img],
      reportType: [this.attendanceReport.reportType, [Validators.required]],
      className: [this.attendanceReport.className, [Validators.required]],
      dateFrom: [this.attendanceReport.dateFrom, [Validators.required]],
      dateTo: [this.attendanceReport.dateTo, [Validators.required]],
      attendancePercentage: [this.attendanceReport.attendancePercentage, [Validators.required]],
      generatedBy: [this.attendanceReport.generatedBy, [Validators.required]],
      date: [this.attendanceReport.date, [Validators.required]],
      status: [this.attendanceReport.status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.attendanceReportForm.valid) {
      const formData = this.attendanceReportForm.getRawValue();
      if (this.action === 'edit') {
        this.attendanceReportService.updateAttendanceReport(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Update Error:', error); },
        });
      } else {
        this.attendanceReportService.addAttendanceReport(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Add Error:', error); },
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
