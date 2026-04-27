import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { GradeSubmissionService } from '../../grade-submission.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  studentName: string;
  grade: string;
}

@Component({
  selector: 'app-grade-submission-delete',
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
export class GradeSubmissionDeleteComponent {
  dialogRef = inject<MatDialogRef<GradeSubmissionDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  gradeService = inject(GradeSubmissionService);

  confirmDelete(): void {
    this.gradeService.deleteGradeSubmission(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
