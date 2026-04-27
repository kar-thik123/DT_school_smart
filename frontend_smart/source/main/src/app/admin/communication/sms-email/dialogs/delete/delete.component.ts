import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SmsEmailService } from '../../sms-email.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  type: string;
  recipient: string;
  subject: string;
}

@Component({
    selector: 'app-sms-email-delete',
    templateUrl: './delete.component.html',
    styleUrls: ['./delete.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
        MatDialogClose,
    ]
})
export class SmsEmailDeleteComponent {
  dialogRef = inject<MatDialogRef<SmsEmailDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  smsEmailService = inject(SmsEmailService);

  confirmDelete(): void {
    this.smsEmailService.deleteSmsEmail(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
