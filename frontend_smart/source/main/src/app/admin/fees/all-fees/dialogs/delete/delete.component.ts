import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { FeesService } from '../../fees.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  rollNo: string;
  studentName: string;
}

@Component({
  selector: 'app-all-fees-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AllFeesDeleteComponent {
  dialogRef = inject<MatDialogRef<AllFeesDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  feesService = inject(FeesService);

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmDelete(): void {
    this.feesService.deleteFees(this.data.id).subscribe({
      next: (response) => {
        // Handle successful deletion
        this.dialogRef.close(response); // Close the dialog with the response
        // Optionally, handle other UI actions like refreshing a list
      },
      error: (error) => {
        console.error('Delete Error:', error);
        // Handle error appropriately
      },
    });
  }
}
