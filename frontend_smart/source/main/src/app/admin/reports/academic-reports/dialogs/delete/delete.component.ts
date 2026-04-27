import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AcademicReportService } from '../../academic-report.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  reportType: string;
  className: string;
  subject: string;
}

@Component({
  selector: 'app-academic-report-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose],
})
export class AcademicReportDeleteComponent {
  dialogRef = inject<MatDialogRef<AcademicReportDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  academicReportService = inject(AcademicReportService);

  confirmDelete(): void {
    this.academicReportService.deleteAcademicReport(this.data.id).subscribe({
      next: (response) => { this.dialogRef.close(response); },
      error: (error) => { console.error('Delete Error:', error); },
    });
  }
}
