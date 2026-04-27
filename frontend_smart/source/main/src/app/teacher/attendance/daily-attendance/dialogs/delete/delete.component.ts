import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { DailyAttendanceService } from '../../daily-attendance.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  studentName: string;
  date: string;
}

@Component({
  selector: 'app-daily-attendance-delete',
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
export class DailyAttendanceDeleteComponent {
  dialogRef = inject<MatDialogRef<DailyAttendanceDeleteComponent>>(MatDialogRef);
  data = inject<any>(MAT_DIALOG_DATA);
  attendanceService = inject(DailyAttendanceService);

  confirmDelete(): void {
    this.attendanceService.deleteDailyAttendance(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
