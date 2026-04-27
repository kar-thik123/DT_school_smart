import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { FeesDiscountService } from '../../fees-discount.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  discountId: number;
  discountType: string;
  discountPercentage: string;
}

@Component({
  selector: 'app-all-fees-discounts-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AllFeesDiscountsDeleteComponent {
  dialogRef = inject<MatDialogRef<AllFeesDiscountsDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  feesDiscountService = inject(FeesDiscountService);


  onNoClick(): void {
    this.dialogRef.close(); // Close the dialog without action
  }

  confirmDelete(): void {
    this.feesDiscountService
      .deleteFeesDiscount(this.data.discountId)
      .subscribe({
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
