import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { OnlineApplicationService } from '../../online-applications.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  student_name: string;
}

@Component({
  selector: 'app-online-application-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class OnlineApplicationDeleteComponent {
  dialogRef =
    inject<MatDialogRef<OnlineApplicationDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  onlineApplicationService = inject(OnlineApplicationService);

  confirmDelete(): void {
    this.onlineApplicationService
      .deleteOnlineApplication(this.data.id)
      .subscribe({
        next: (response) => {
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Delete Error:', error);
        },
      });
  }
}
