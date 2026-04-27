import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DialogData {
  id: number;
  student_name: string;
  student_id: string;
  attendance_date: string;
}

@Component({
  selector: 'app-attendance-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  standalone: true,
  imports: [MatDialogContent, MatButtonModule, MatDialogClose, MatIconModule],
})
export class AttendanceDeleteComponent {
  constructor(
    public dialogRef: MatDialogRef<AttendanceDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.dialogRef.close(true);
  }
}
