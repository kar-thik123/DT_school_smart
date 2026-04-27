import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeaveStatusService } from '../../leave-status.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  leaveType: string;
  startDate: string;
}

@Component({
  selector: 'app-leave-status-delete',
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
export class LeaveStatusDeleteComponent {
  dialogRef = inject<MatDialogRef<LeaveStatusDeleteComponent>>(MatDialogRef);
  data = inject<any>(MAT_DIALOG_DATA);
  leaveService = inject(LeaveStatusService);

  confirmDelete(): void {
    this.leaveService.deleteLeaveStatus(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
