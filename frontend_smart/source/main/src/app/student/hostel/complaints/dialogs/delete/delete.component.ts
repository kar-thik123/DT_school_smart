import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions, MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Complaint } from '../../complaints.model';
import { ComplaintsService } from '../../complaints.service';

@Component({
    selector: 'app-complaints-delete',
    templateUrl: './delete.component.html',
    imports: [
        CommonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
        MatButtonModule,
    ],
    standalone: true
})
export class ComplaintsDeleteComponent {
  dialogRef = inject(MatDialogRef<ComplaintsDeleteComponent>);
  data = inject<Complaint>(MAT_DIALOG_DATA);
  complaintsService = inject(ComplaintsService);

  confirmDelete(): void {
    this.complaintsService.deleteComplaint(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
