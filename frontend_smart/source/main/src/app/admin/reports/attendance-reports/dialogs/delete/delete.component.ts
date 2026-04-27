import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AttendanceReportService } from '../../attendance-report.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  reportType: string;
  className: string;
}

@Component({
  selector: 'app-attendance-report-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose],
})
export class AttendanceReportDeleteComponent {
  dialogRef = inject<MatDialogRef<AttendanceReportDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  attendanceReportService = inject(AttendanceReportService);

  confirmDelete(): void {
    this.attendanceReportService.deleteAttendanceReport(this.data.id).subscribe({
      next: (response) => { this.dialogRef.close(response); },
      error: (error) => { console.error('Delete Error:', error); },
    });
  }
}
