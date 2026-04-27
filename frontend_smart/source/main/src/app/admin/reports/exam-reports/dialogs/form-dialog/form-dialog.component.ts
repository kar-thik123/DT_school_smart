import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { ExamReportService } from '../../exam-report.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExamReport } from '../../exam-report.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  examReport: ExamReport;
}

@Component({
  selector: 'app-exam-report-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [MatButtonModule, MatIconModule, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatInputModule, MatDialogClose],
})
export class ExamReportFormComponent {
  dialogRef = inject<MatDialogRef<ExamReportFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  examReportService = inject(ExamReportService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  examReportForm: UntypedFormGroup;
  examReport: ExamReport;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle = this.action === 'edit' ? data.examReport.examName : 'New Exam Report';
    this.examReport = this.action === 'edit' ? data.examReport : new ExamReport({} as ExamReport);
    this.examReportForm = this.createExamReportForm();
  }

  createExamReportForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.examReport.id],
      img: [this.examReport.img],
      examName: [this.examReport.examName, [Validators.required]],
      className: [this.examReport.className, [Validators.required]],
      subject: [this.examReport.subject, [Validators.required]],
      examDate: [this.examReport.examDate, [Validators.required]],
      passPercentage: [this.examReport.passPercentage, [Validators.required]],
      averageMarks: [this.examReport.averageMarks, [Validators.required]],
      generatedBy: [this.examReport.generatedBy, [Validators.required]],
      date: [this.examReport.date, [Validators.required]],
      status: [this.examReport.status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.examReportForm.valid) {
      const formData = this.examReportForm.getRawValue();
      if (this.action === 'edit') {
        this.examReportService.updateExamReport(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Update Error:', error); },
        });
      } else {
        this.examReportService.addExamReport(formData).subscribe({
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
