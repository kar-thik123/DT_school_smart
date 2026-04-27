import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { ComplaintsService } from '../../complaints.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  complaintId: number;
  complainantName: string;
  complainantType: string;
}

@Component({
    selector: 'app-complaints-delete',
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
export class ComplaintsDeleteComponent {
  dialogRef = inject<MatDialogRef<ComplaintsDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  complaintsService = inject(ComplaintsService);


  confirmDelete(): void {
    this.complaintsService.deleteComplaint(this.data.complaintId).subscribe({
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
