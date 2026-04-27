import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { TransportFeeService } from '../../transport-fees.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-fees-delete',
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
export class FeesDeleteComponent {
  feeService = inject(TransportFeeService);

  constructor(
    public dialogRef: MatDialogRef<FeesDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmDelete(): void {
    this.feeService.deleteFee(this.data.id).subscribe(() => {
      this.dialogRef.close(1);
    });
  }
}
