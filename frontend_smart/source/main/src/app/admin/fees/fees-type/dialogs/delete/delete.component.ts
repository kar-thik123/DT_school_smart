import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { FeesTypeService } from '../../fees-type.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  feeTypeId: number;
  feeTypeName: string;
  category: string;
  amount: string;
}

@Component({
  selector: 'app-all-fees-types-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AllFeesTypesDeleteComponent {
  dialogRef = inject<MatDialogRef<AllFeesTypesDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  feesTypeService = inject(FeesTypeService);


  onNoClick(): void {
    this.dialogRef.close(); // Close the dialog without action
  }

  confirmDelete(): void {
    this.feesTypeService.deleteFeesType(this.data.feeTypeId).subscribe({
      next: (response) => {
        // Handle successful deletion
        this.dialogRef.close(response); // Close the dialog with the response
        // Optionally, refresh a list or show a notification
      },
      error: (error) => {
        console.error('Delete Error:', error);
        // Handle error appropriately
      },
    });
  }
}
