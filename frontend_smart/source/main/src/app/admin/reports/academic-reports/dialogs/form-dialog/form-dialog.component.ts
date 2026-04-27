import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AcademicReportService } from '../../academic-report.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AcademicReport } from '../../academic-report.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  academicReport: AcademicReport;
}

@Component({
  selector: 'app-academic-report-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [MatButtonModule, MatIconModule, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatInputModule, MatDialogClose],
})
export class AcademicReportFormComponent {
  dialogRef = inject<MatDialogRef<AcademicReportFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  academicReportService = inject(AcademicReportService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  academicReportForm: UntypedFormGroup;
  academicReport: AcademicReport;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle = this.action === 'edit' ? data.academicReport.reportType : 'New Academic Report';
    this.academicReport = this.action === 'edit' ? data.academicReport : new AcademicReport({} as AcademicReport);
    this.academicReportForm = this.createAcademicReportForm();
  }

  createAcademicReportForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.academicReport.id],
      img: [this.academicReport.img],
      reportType: [this.academicReport.reportType, [Validators.required]],
      className: [this.academicReport.className, [Validators.required]],
      subject: [this.academicReport.subject, [Validators.required]],
      academicYear: [this.academicReport.academicYear, [Validators.required]],
      term: [this.academicReport.term, [Validators.required]],
      generatedBy: [this.academicReport.generatedBy, [Validators.required]],
      date: [this.academicReport.date, [Validators.required]],
      status: [this.academicReport.status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.academicReportForm.valid) {
      const formData = this.academicReportForm.getRawValue();
      if (this.action === 'edit') {
        this.academicReportService.updateAcademicReport(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Update Error:', error); },
        });
      } else {
        this.academicReportService.addAcademicReport(formData).subscribe({
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
