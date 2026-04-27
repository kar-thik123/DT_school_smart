import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { NoticeService } from '../../notice.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  title: string;
}

@Component({
  selector: 'app-notice-delete',
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
export class NoticeDeleteComponent {
  dialogRef = inject<MatDialogRef<NoticeDeleteComponent>>(MatDialogRef);
  data = inject<any>(MAT_DIALOG_DATA);
  noticeService = inject(NoticeService);

  confirmDelete(): void {
    this.noticeService.deleteNotice(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
