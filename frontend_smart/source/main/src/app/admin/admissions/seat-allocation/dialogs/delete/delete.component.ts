import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SeatAllocationService } from '../../seat-allocation.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  student_name: string;
}

@Component({
  selector: 'app-seat-allocation-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class SeatAllocationDeleteComponent {
  dialogRef = inject<MatDialogRef<SeatAllocationDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  seatAllocationService = inject(SeatAllocationService);

  confirmDelete(): void {
    this.seatAllocationService.deleteSeatAllocation(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
