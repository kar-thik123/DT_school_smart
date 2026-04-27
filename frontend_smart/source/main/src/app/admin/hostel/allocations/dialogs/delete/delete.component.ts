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
  hostel_name: string;
}

@Component({
  selector: 'app-allocation-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  standalone: true,
  imports: [MatDialogContent, MatButtonModule, MatDialogClose, MatIconModule],
})
export class AllocationDeleteComponent {
  constructor(
    public dialogRef: MatDialogRef<AllocationDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.dialogRef.close(true);
  }
}
