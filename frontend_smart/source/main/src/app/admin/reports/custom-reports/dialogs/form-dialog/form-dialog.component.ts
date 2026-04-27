import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { CustomReportService } from '../../custom-report.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomReport } from '../../custom-report.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  customReport: CustomReport;
}

@Component({
  selector: 'app-custom-report-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [MatButtonModule, MatIconModule, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatInputModule, MatDialogClose],
})
export class CustomReportFormComponent {
  dialogRef = inject<MatDialogRef<CustomReportFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  customReportService = inject(CustomReportService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  customReportForm: UntypedFormGroup;
  customReport: CustomReport;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle = this.action === 'edit' ? data.customReport.reportName : 'New Custom Report';
    this.customReport = this.action === 'edit' ? data.customReport : new CustomReport({} as CustomReport);
    this.customReportForm = this.createCustomReportForm();
  }

  createCustomReportForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.customReport.id],
      reportName: [this.customReport.reportName, [Validators.required]],
      description: [this.customReport.description, [Validators.required]],
      category: [this.customReport.category, [Validators.required]],
      createdBy: [this.customReport.createdBy, [Validators.required]],
      date: [this.customReport.date, [Validators.required]],
      status: [this.customReport.status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.customReportForm.valid) {
      const formData = this.customReportForm.getRawValue();
      if (this.action === 'edit') {
        this.customReportService.updateCustomReport(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Update Error:', error); },
        });
      } else {
        this.customReportService.addCustomReport(formData).subscribe({
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
