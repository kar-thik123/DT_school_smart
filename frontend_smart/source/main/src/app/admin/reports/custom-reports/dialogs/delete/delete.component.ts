import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { CustomReportService } from '../../custom-report.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  reportName: string;
}

@Component({
  selector: 'app-custom-report-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose],
})
export class CustomReportDeleteComponent {
  dialogRef = inject<MatDialogRef<CustomReportDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  customReportService = inject(CustomReportService);

  confirmDelete(): void {
    this.customReportService.deleteCustomReport(this.data.id).subscribe({
      next: (response) => { this.dialogRef.close(response); },
      error: (error) => { console.error('Delete Error:', error); },
    });
  }
}
