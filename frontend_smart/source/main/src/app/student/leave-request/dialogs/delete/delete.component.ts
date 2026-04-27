import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeaveRequestService } from '../../leave-request.service';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  class: string;
  section: string;
  applyDate: string;
}

@Component({
  selector: 'app-std-leave-request-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    DatePipe,
  ],
})
export class StdLeaveRequestDeleteComponent {
  dialogRef = inject<MatDialogRef<StdLeaveRequestDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  leaveRequestService = inject(LeaveRequestService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.leaveRequestService.deleteLeaveRequest(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
