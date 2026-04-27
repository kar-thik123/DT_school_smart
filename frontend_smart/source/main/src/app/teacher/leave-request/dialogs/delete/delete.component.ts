import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeaveRequestService } from '../../leave-request.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  leaveId: number;
  leaveType: string;
  status: string;
}

@Component({
  selector: 'app-teacher-leave-request-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class TeacherLeaveRequestDeleteComponent {
  dialogRef = inject<MatDialogRef<TeacherLeaveRequestDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  leaveRequestService = inject(LeaveRequestService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.leaveRequestService.deleteLeaveRequest(this.data.leaveId).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error(err);
        // Depending on requirements, we might want to close with error or show a message.
        // For now, logging error and not closing or closing with 0 is safer?
        // Let's assume we just log and maybe close with nothing or 0 if we want to cancel the UI update.
        // But usually we just let it hang or show a message. For simplicity matching likely patterns:
        // this.dialogRef.close(0);
      },
    });
  }
}
