import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AssignmentService } from '../../assignment.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  className: string;
  subjectName: string;
}

@Component({
  selector: 'app-assignment-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AssignmentDeleteComponent {
  dialogRef = inject(MatDialogRef<AssignmentDeleteComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  assignmentService = inject(AssignmentService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.assignmentService.deleteAssignment(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
