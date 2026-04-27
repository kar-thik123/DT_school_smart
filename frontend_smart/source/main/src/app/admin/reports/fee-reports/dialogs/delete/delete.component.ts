import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { FeeReportService } from '../../fee-report.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  reportType: string;
  feeCategory: string;
}

@Component({
  selector: 'app-fee-report-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose],
})
export class FeeReportDeleteComponent {
  dialogRef = inject<MatDialogRef<FeeReportDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  feeReportService = inject(FeeReportService);

  confirmDelete(): void {
    this.feeReportService.deleteFeeReport(this.data.id).subscribe({
      next: (response) => { this.dialogRef.close(response); },
      error: (error) => { console.error('Delete Error:', error); },
    });
  }
}
