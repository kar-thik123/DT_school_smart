import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AttendanceSummaryService } from '../../attendance-summary.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  class: string;
  subject: string;
  date: string;
}

@Component({
  selector: 'app-attendance-summary-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatDialogClose,
  ],
})
export class AttendanceSummaryDeleteComponent {
  dialogRef = inject<MatDialogRef<AttendanceSummaryDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  summaryService = inject(AttendanceSummaryService);

  confirmDelete(): void {
    this.summaryService.deleteSummary(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}

