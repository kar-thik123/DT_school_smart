import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { ExamReportService } from '../../exam-report.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  examName: string;
  className: string;
}

@Component({
  selector: 'app-exam-report-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose],
})
export class ExamReportDeleteComponent {
  dialogRef = inject<MatDialogRef<ExamReportDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  examReportService = inject(ExamReportService);

  confirmDelete(): void {
    this.examReportService.deleteExamReport(this.data.id).subscribe({
      next: (response) => { this.dialogRef.close(response); },
      error: (error) => { console.error('Delete Error:', error); },
    });
  }
}
