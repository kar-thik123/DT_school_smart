import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeaveTypesService } from '../leave-types.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  leave_name: string;
  type: string;
  leave_unit: string;
}

@Component({
  selector: 'app-leave-request-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatDialogClose,
  ],
})
export class LeaveRequestDeleteComponent {
  dialogRef = inject<MatDialogRef<LeaveRequestDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  leaveTypesService = inject(LeaveTypesService);

  confirmDelete(): void {
    this.leaveTypesService.deleteLeaveType(this.data.id).subscribe({
      next: (response) => {
        // console.log('Delete Response:', response);
        this.dialogRef.close(response); // Close with the response data
        // Handle successful deletion, e.g., refresh the table or show a notification
      },
      error: (error) => {
        console.error('Delete Error:', error);
        // Handle the error appropriately
      },
    });
  }
}
