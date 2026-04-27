import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SystemLogService } from '../../system-log.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  activity: string;
}

@Component({
  selector: 'app-system-log-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose],
})
export class SystemLogDeleteComponent {
  dialogRef = inject<MatDialogRef<SystemLogDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  systemLogService = inject(SystemLogService);

  confirmDelete(): void {
    this.systemLogService.deleteLog(this.data.id).subscribe({
      next: (response) => { this.dialogRef.close(response); },
      error: (error) => { console.error('Delete Error:', error); },
    });
  }
}
