import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { StudentAllocationService } from '../../student-allocation.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-allocation-delete',
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
export class AllocationDeleteComponent {
  allocationService = inject(StudentAllocationService);

  constructor(
    public dialogRef: MatDialogRef<AllocationDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmDelete(): void {
    this.allocationService.deleteAllocation(this.data.id).subscribe(() => {
      this.dialogRef.close(1);
    });
  }
}
