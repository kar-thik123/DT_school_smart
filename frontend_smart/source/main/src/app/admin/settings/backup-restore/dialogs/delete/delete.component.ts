import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { BackupRestoreService } from '../../backup-restore.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  backupName: string;
}

@Component({
  selector: 'app-backup-restore-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose],
})
export class BackupRestoreDeleteComponent {
  dialogRef = inject<MatDialogRef<BackupRestoreDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  backupRestoreService = inject(BackupRestoreService);

  confirmDelete(): void {
    this.backupRestoreService.deleteBackup(this.data.id).subscribe({
      next: (response) => { this.dialogRef.close(response); },
      error: (error) => { console.error('Delete Error:', error); },
    });
  }
}
