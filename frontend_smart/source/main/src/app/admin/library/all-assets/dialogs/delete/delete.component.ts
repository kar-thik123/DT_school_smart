import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AllAssetsService } from '../../all-assets.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  no: string;
  title: string;
  subject: string;
}

@Component({
  selector: 'app-all-assets-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AllAssetsDeleteComponent {
  dialogRef = inject<MatDialogRef<AllAssetsDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  allAssetsService = inject(AllAssetsService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.allAssetsService.deleteAsset(this.data.id).subscribe({
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
