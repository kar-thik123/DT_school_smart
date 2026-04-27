import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SubstitutionRequestService } from '../../substitution-request.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  subject: string;
  date: string;
}

@Component({
  selector: 'app-substitution-delete',
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
export class SubstitutionDeleteComponent {
  dialogRef = inject<MatDialogRef<SubstitutionDeleteComponent>>(MatDialogRef);
  data = inject<any>(MAT_DIALOG_DATA);
  requestService = inject(SubstitutionRequestService);

  confirmDelete(): void {
    this.requestService.deleteRequest(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
