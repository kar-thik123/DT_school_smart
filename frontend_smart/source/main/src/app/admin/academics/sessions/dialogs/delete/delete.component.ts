import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SessionsService } from '../../sessions.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  sessionName: string;
}

@Component({
  selector: 'app-sessions-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class SessionsDeleteComponent {
  dialogRef = inject(MatDialogRef<SessionsDeleteComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  sessionsService = inject(SessionsService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.sessionsService.deleteSession(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
