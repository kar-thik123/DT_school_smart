import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { VisitorsService } from '../../visitors.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  visitorId: number;
  visitorName: string;
  visitDate: string;
}

@Component({
    selector: 'app-visitors-delete',
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
export class VisitorsDeleteComponent {
  dialogRef = inject<MatDialogRef<VisitorsDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  visitorsService = inject(VisitorsService);


  confirmDelete(): void {
    this.visitorsService.deleteVisitor(this.data.visitorId).subscribe({
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
