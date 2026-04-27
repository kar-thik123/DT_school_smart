import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { LibraryReportService } from '../../library-reports.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LibraryReport } from '../../library-reports.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  libraryReport: LibraryReport;
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
  libraryReportForm: UntypedFormGroup;
  libraryReport: LibraryReport;

  private libraryReportService = inject(LibraryReportService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = data.libraryReport.report_name;
      this.libraryReport = data.libraryReport;
    } else {
      this.dialogTitle = 'New Library Report';
      this.libraryReport = new LibraryReport({} as LibraryReport);
    }
    this.libraryReportForm = this.createLibraryReportForm();
  }

  createLibraryReportForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.libraryReport.id],
      report_name: [this.libraryReport.report_name, [Validators.required]],
      generated_date: [this.libraryReport.generated_date, [Validators.required]],
      type: [this.libraryReport.type, [Validators.required]],
      status: [this.libraryReport.status, [Validators.required]],
    });
  }

  submit() {
    if (this.libraryReportForm.valid) {
      const libraryReportData = this.libraryReportForm.getRawValue();
      if (this.action === 'edit') {
        this.libraryReportService.updateLibraryReport(libraryReportData).subscribe(() => {
          this.dialogRef.close(libraryReportData);
        });
      } else {
        this.libraryReportService.addLibraryReport(libraryReportData).subscribe(() => {
          this.dialogRef.close(libraryReportData);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
