import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StaffService } from '../../staff.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  name: string;
  designation: string;
  mobile: string;
}

@Component({
  selector: 'app-all-staff-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AllStaffDeleteComponent {
  dialogRef = inject<MatDialogRef<AllStaffDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  staffService = inject(StaffService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.staffService.deleteStaff(this.data.id).subscribe({
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
